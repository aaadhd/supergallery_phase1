#!/usr/bin/env python3
"""
Scan _planning/*.md for local links [text](path.md#frag) and verify
target file declares id="frag" via <a id>, <h1–h6 id>, 펜스 밖 마크다운 제목(#–######)에서 파생한 GFM류 슬러그.
레거시 Policy용 블록 `<div id="policy-…">`는 참조용으로만 매칭한다.

예시·설명용으로만 쓰인 링크(인라인 코드 `` `...` `` 안, ``` 펜스 블록 안)은 검사에서 제외한다.
동일 줄에 `[텍스트](#앵커)` 예시를 두면 상대 앵커가 현재 파일로 오인되므로,
문서 본문 예시는 `./대상.md#앵커` 형태를 권장한다(README 「문서 갱신 규칙」 참고).
"""

from __future__ import annotations

import re
import sys
from pathlib import Path
from urllib.parse import unquote

from md_heading_slugs import heading_slug_set_from_text

ROOT = Path(__file__).resolve().parent.parent
MD_LINK = re.compile(r"\[[^\]]*\]\(([^)]+)\)")


def mask_inline_backticks(line: str) -> str:
    """Replace characters inside paired `...` with spaces so [](...) is not matched."""
    out: list[str] = []
    i = 0
    n = len(line)
    while i < n:
        if line[i] == "`":
            out.append(" ")
            i += 1
            while i < n and line[i] != "`":
                out.append(" ")
                i += 1
            if i < n:
                out.append(" ")
                i += 1
        else:
            out.append(line[i])
            i += 1
    return "".join(out)


def split_link(url: str) -> tuple[str | None, str | None]:
    url = unquote(url.strip())
    if "#" in url:
        path, frag = url.split("#", 1)
        return (path or None, frag)
    return (url, None)


def collect_ids(text: str) -> set[str]:
    ids: set[str] = set()
    ids.update(re.findall(r'<a\s+id="([^"]+)"\s*/?>', text, re.I))
    ids.update(re.findall(r"<h[1-6]\b[^>]*\bid=\"([^\"]+)\"", text, re.I))
    # Policy_v1: 블록 고정 앵커(div/span) — 미리보기 조각 스크롤 정합
    ids.update(
        re.findall(
            r"<(?:div|span)\b[^>]*\bid=\"(policy-[^\"]+)\"", text, re.I
        )
    )
    return ids


def is_external(url: str) -> bool:
    u = url.lower()
    return u.startswith("http://") or u.startswith("https://") or u.startswith("mailto:")


def main() -> None:
    issues: list[tuple[str, int, str, str, str]] = []  # file, line, link, reason, target
    all_md = sorted(ROOT.glob("*.md"))
    file_text: dict[str, str] = {}
    file_ids: dict[str, set[str]] = {}

    for p in all_md:
        if p.name.startswith("_"):
            continue
        t = p.read_text(encoding="utf-8")
        file_text[p.name] = t
        file_ids[p.name] = collect_ids(t)
        file_ids[p.name].update(heading_slug_set_from_text(t))

    for src_name, text in file_text.items():
        in_fence = False
        for i, line in enumerate(text.splitlines(), 1):
            stripped = line.strip()
            if stripped.startswith("```"):
                in_fence = not in_fence
                continue
            if in_fence:
                continue

            scan_line = mask_inline_backticks(line)
            for m in MD_LINK.finditer(scan_line):
                raw = m.group(1)
                if raw.startswith("<"):
                    continue
                # strip title "url 'title'"
                url = raw.split()[0] if raw else ""
                if is_external(url) or not url:
                    continue
                path_part, frag = split_link(url)
                if frag is None:
                    continue
                path_part = path_part.lstrip("./") if path_part else ""
                if path_part == "":
                    target = src_name
                elif "/" in path_part:
                    # skip subdirs for this audit scope
                    continue
                else:
                    if not path_part.endswith(".md"):
                        continue
                    target = path_part

                if target not in file_text:
                    issues.append((src_name, i, raw, "대상 파일 없음", target))
                    continue

                if frag not in file_ids[target]:
                    issues.append((src_name, i, raw, "id 미존재", f"{target}#{frag}"))

    if not issues:
        print(
            "OK: 로컬 .md #앵커 전수 검사에서 불일치 없음 "
            "(<a id> / <h1–h6 id> / 마크다운 제목 슬러그 / policy div·span 레거시)."
        )
        return

    print(
        f"문제 {len(issues)}건 "
        "(<a id> / <h1–h6 id> / 제목 슬러그 / policy div·span 레거시)\n"
    )
    cur = None
    for src, line, raw, reason, detail in issues:
        key = (src, line)
        if (src, line) != cur:
            print(f"\n--- {src}:{line}")
            cur = (src, line)
        print(f"  {reason}: `{raw}` → {detail}")

    sys.exit(1)


if __name__ == "__main__":
    main()
