#!/usr/bin/env python3
"""
Scan _planning/*.md for local links [text](path.md#frag) and verify
target file contains <a id="frag"> (this repo's convention).
Also flags #fragment with no id in target (false negatives possible if only GFM heading slug).
"""

from __future__ import annotations

import re
import sys
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parent.parent
MD_LINK = re.compile(r"\[[^\]]*\]\(([^)]+)\)")


def split_link(url: str) -> tuple[str | None, str | None]:
    url = unquote(url.strip())
    if "#" in url:
        path, frag = url.split("#", 1)
        return (path or None, frag)
    return (url, None)


def collect_ids(text: str) -> set[str]:
    return set(re.findall(r'<a\s+id="([^"]+)"\s*/?>', text, re.I))


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

    for src_name, text in file_text.items():
        for i, line in enumerate(text.splitlines(), 1):
            for m in MD_LINK.finditer(line):
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
        print("OK: 로컬 .md #앵커 전수 검사에서 불일치 없음 (<a id> 기준).")
        return

    print(f"문제 {len(issues)}건 (<a id=\"...\"> 기준)\n")
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
