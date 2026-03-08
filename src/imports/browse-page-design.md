Design the "둘러보기 (Browse)" page of Art-ier, an artist portfolio platform similar to Behance. Canvas width: 1440px.

The page has 3 sticky horizontal bars stacked at the top, followed by the main feed grid.

---

STICKY BAR 1 — Global Header
Height: 48px. Background: white. Bottom border: 1px solid #E8E8E8.
Left: Logo text "Art-ier" in serif italic font, 20px, black.
Center: Navigation links — 둘러보기 (bold, active) / 마켓 / 배우기 / 커뮤니티 — each 14px, spaced 32px apart.
Right: "작품 올리기" button (black background, white text, 13px, no border-radius, height 32px) + bell icon + message icon + user avatar circle (32px).

---

STICKY BAR 2 — Search & Filter Bar
Height: 48px. Background: white. Bottom border: 1px solid #E8E8E8.
Left: sliders icon + "필터" text (13px, gray #666).
Center: search input field, width 480px, height 36px, border 1px solid #DDDDDD, no border-radius, placeholder "작품, 작가 검색..." with search icon on left and camera icon on right inside the field.
Right of search: text tabs "작품 | 작가 | 컬렉션" (13px, separated by thin vertical dividers) + "추천순 ▾" sort dropdown (13px, gray).

---

STICKY BAR 3 — Category Tab Bar
Height: 44px. Background: white. Bottom border: 1px solid #E8E8E8.
Horizontally scrollable pill-shaped tab list. Each tab: border-radius 20px, padding 6px 14px, font 13px.
Default tab style: background #F2F2F2, text color #666666.
Active tab style: background #1A1A1A, text color #FFFFFF.

Tab list (left to right):
1. ✦ For You — ACTIVE (black bg, white text)
2. ♡ Following
3. ★ 인기 작품
4. 일러스트
5. 수채화
6. 디지털아트
7. 사진
8. 조각
9. 드로잉
10. 기타

Far right of tab bar: "피드 맞춤설정" text link (13px, #888, with small settings icon).

---

MAIN CONTENT — Masonry Gallery Grid
Top padding: 20px. Horizontal padding: 24px. Column gap: 16px. Row gap: 16px.
Layout: 5-column masonry grid (variable row heights). No border-radius on cards (0px — sharp corners).

Show 15 artwork cards total. Use solid color fills for image areas (no actual images needed):
Card 1: #E8A87C, height 320px
Card 2: #1B2A4A, height 260px
Card 3: #7A9E7E, height 340px
Card 4: #C4A0A0, height 280px
Card 5: #3A3A3A, height 220px
Card 6: #F0E6D3, height 240px
Card 7: #C4714A, height 380px
Card 8: #6B7FA3, height 200px
Card 9: #7A7A4A, height 300px
Card 10: #E8C4C4, height 360px
Card 11: #1A1A2E, height 220px
Card 12: #D4A04A, height 320px
Card 13: #3A5A3A, height 260px
Card 14: #A0A0C4, height 380px
Card 15: #C46A3A, height 280px

Each card has an info bar below the image (height 36px, white background):
Left side: small circle avatar (20px) + artist name text (13px, #666666). If multiple owners, show "여러 작가 ▾".
Right side: thumbs-up icon (14px, gray) + count like "1.2천" + eye icon (14px, gray) + count like "8.3천". Both in 12px, #888888.

---

HOVER STATE (show as a separate annotated frame next to the main frame):
On hover, the card image area shows:
- Dark overlay: rgba(0,0,0,0.45) covering the full image
- Bottom gradient: linear-gradient from rgba(0,0,0,0.7) at bottom to transparent at 50% height
- Top-left: pill button "저장" with bookmark icon, background rgba(30,30,30,0.85), white text, 12px, border-radius 4px, height 28px
- Top-right: category tag pill e.g. "일러스트", same dark pill style, 11px, height 24px
- Bottom-left (just above info bar): artwork title in white, 14px medium weight, max 2 lines
The info bar below stays unchanged (white background, same content).

---

DESIGN RULES:
- White background throughout (#FFFFFF)
- No drop shadows on cards
- No border-radius on cards (0px — editorial/gallery aesthetic)
- Font: DM Sans for all UI text, Playfair Display italic for logo only
- The artwork image is the hero — all UI chrome should be minimal
- Hover transition: opacity fade, 200ms ease
