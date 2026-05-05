#!/usr/bin/env python3
"""
Expand [Label] to [Label](./target.md#frag) using merged 인용 정의 + 추론 규칙.
전역으로 모든 _planning/*.md 의 마지막 <!-- 인용 정의 --> 를 합쳐 라벨 해석 누락을 줄인다.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path


MARKER = "<!-- 인용 정의 -->"


def parse_definitions(block: str) -> dict[str, str]:
    defs: dict[str, str] = {}
    for line in block.splitlines():
        m = re.match(r"^\[([^\]]+)\]:\s*(.+?)\s*$", line)
        if m:
            defs[m.group(1)] = m.group(2).strip()
    return defs


def collect_all_definitions(root: Path) -> dict[str, str]:
    """Merge [label]: url from every file's last definition block. Later files win on duplicate keys."""
    merged: dict[str, str] = {}
    for path in sorted(root.glob("*.md")):
        if path.name.startswith("_"):
            continue
        text = path.read_text(encoding="utf-8")
        if MARKER not in text:
            continue
        _head, tail = text.rsplit(MARKER, 1)
        for k, v in parse_definitions(tail).items():
            merged[k] = v
    return merged


def resolve_url(url: str, current_name: str) -> str:
    url = url.strip()
    if url.startswith("http://") or url.startswith("https://"):
        return url
    if url.startswith("#"):
        return f"./{current_name}{url}"
    if url.startswith("./"):
        return url
    if ".md" in url.split("#", 1)[0]:
        return "./" + url if not url.startswith("./") else url
    return url


def strip_version_suffix(label: str) -> str:
    """[Policy §12.2 v2.20] → [Policy §12.2]"""
    return re.sub(r"\s+v[\d.]+\s*$", "", label.strip())


def should_skip_label(label: str) -> bool:
    """표준문서 플레이스홀더·변호사 체크 항목 등 링크 대상 아님."""
    if len(label) > 120:
        return True
    if label.startswith("변호사 확인") or label.startswith("카카오 알림톡") or label.startswith("이메일 발송업체"):
        return True
    if "변호사 확인 후" in label and len(label) > 40:
        return True
    if "시행일 —" in label:
        return True
    # README 표 예시 자리표시자
    if "§X" in label or "XXX-NN" in label or "Handoff명" in label:
        return True
    if label.startswith("<"):
        return True
    return False


_POLICY_SECTION_MAP: dict[str, str] | None = None


def _policy_section_map() -> dict[str, str]:
    global _POLICY_SECTION_MAP
    if _POLICY_SECTION_MAP is None:
        from policy_gfm_slugs import policy_section_key_to_slug

        root = Path(__file__).resolve().parent.parent
        text = (root / "Policy_v1.md").read_text(encoding="utf-8")
        _POLICY_SECTION_MAP = policy_section_key_to_slug(text)
    return _POLICY_SECTION_MAP


def infer_policy_url(label: str) -> str | None:
    """Policy §… / §… (Policy 파일 내) 숫자 소절 → Policy_v1.md GFM 제목 슬러그."""
    from policy_gfm_slugs import slug_for_section_key

    lab = strip_version_suffix(label)
    if lab.startswith("Policy §"):
        inner = lab[len("Policy §") :].strip()
    elif lab.startswith("§") and not re.match(r"^§0\.", lab):
        inner = lab[1:].strip()
    else:
        return None

    inner = strip_version_suffix(inner)

    if re.match(r"^31\s+N-", inner) or inner == "31":
        inner = "31"

    m = re.match(r"^(\d+(?:\.\d+)*)\s+L-(\d+)$", inner)
    if m:
        dotted = m.group(1)
        frag = slug_for_section_key(_policy_section_map(), dotted)
        return f"./Policy_v1.md#{frag}" if frag else None

    m = re.match(r"^(\d+(?:\.\d+)*)$", inner)
    if m:
        dotted = m.group(1)
        frag = slug_for_section_key(_policy_section_map(), dotted)
        return f"./Policy_v1.md#{frag}" if frag else None

    return None


def infer_prd_admin_section(label: str) -> str | None:
    """PRD_Admin_v1.md 내 [§0.4.1] 형태."""
    lab = strip_version_suffix(label)
    m = re.fullmatch(r"§(0\.\d+(?:\.\d+)?)", lab)
    if not m:
        return None
    sec = m.group(1)
    section_anchor = {
        "0.4.1": "041-권한-레벨-정의",
        "0.4.3": "043-뷰어-read-원칙",
        "0.6": "06-감사-로그-audit-trail",
    }
    if sec not in section_anchor:
        return None
    return f"./PRD_Admin_v1.md#{section_anchor[sec]}"


def supplement_definitions(root: Path, merged: dict[str, str]) -> dict[str, str]:
    out = dict(merged)
    # 문서 파일명 자기 링크
    for path in sorted(root.glob("*.md")):
        if path.name.startswith("_"):
            continue
        name = path.name
        out.setdefault(name, name)
        out.setdefault(name.replace(".md", ""), name)  # unused but harmless

    # Policy 인용 블록에 없던 화면 ID (앵커는 PRD_User에 추가됨)
    out.setdefault(
        "USR-EVT-01",
        "PRD_User_v1.md#usr-evt-01--응모전-목록",
    )
    return out


def lookup_url(label: str, defs: dict[str, str], current_name: str) -> str | None:
    if should_skip_label(label):
        return None

    for candidate in (label, strip_version_suffix(label)):
        if candidate in defs:
            return resolve_url(defs[candidate], current_name)

    if current_name == "PRD_Admin_v1.md":
        u = infer_prd_admin_section(label)
        if u:
            return u

    u = infer_policy_url(label)
    if u:
        return u

    return None


def expand_body(body: str, defs: dict[str, str], current_name: str) -> str:
    """
    Replace [label] with [label](url) when lookup succeeds.
    Longest-first: collect all unique bracket tokens that look like citations and sort by length.
    """
    # Find [...] that are not ![...] and not already [...](
    token_pattern = re.compile(
        r"(?<!\!)\[([^\]]+)\](?!\()"
    )

    def replacer(match: re.Match[str]) -> str:
        label = match.group(1)
        url = lookup_url(label, defs, current_name)
        if not url:
            return match.group(0)
        return f"[{label}]({url})"

    def process_line_outside_backticks(line: str) -> str:
        parts = re.split(r"(`[^`]*`)", line)
        out: list[str] = []
        for i, p in enumerate(parts):
            if i % 2 == 1:
                out.append(p)
            else:
                out.append(token_pattern.sub(replacer, p))
        return "".join(out)

    out_lines: list[str] = []
    in_fence = False
    for line in body.splitlines():
        stripped = line.lstrip()
        if stripped.startswith("```"):
            in_fence = not in_fence
            out_lines.append(line)
            continue
        if in_fence:
            out_lines.append(line)
            continue
        out_lines.append(process_line_outside_backticks(line))

    return "\n".join(out_lines)


def process_file(path: Path, defs: dict[str, str]) -> bool:
    text = path.read_text(encoding="utf-8")
    if MARKER not in text:
        return False
    head, tail = text.rsplit(MARKER, 1)
    # 로컬 정의가 전역보다 우선
    local = parse_definitions(tail)
    merged = dict(defs)
    merged.update(local)

    new_body = expand_body(head, merged, path.name)
    if new_body == head:
        return False
    path.write_text(new_body + MARKER + tail, encoding="utf-8")
    return True


def main() -> None:
    root = Path(__file__).resolve().parent.parent
    global_defs = supplement_definitions(root, collect_all_definitions(root))

    changed: list[str] = []
    for path in sorted(root.glob("*.md")):
        if path.name.startswith("_"):
            continue
        try:
            if process_file(path, global_defs):
                changed.append(path.name)
        except Exception as e:
            print(f"ERR {path}: {e}", file=sys.stderr)
            sys.exit(1)

    for name in changed:
        print(f"expanded: {name}")
    if not changed:
        print("no files changed")


if __name__ == "__main__":
    main()
