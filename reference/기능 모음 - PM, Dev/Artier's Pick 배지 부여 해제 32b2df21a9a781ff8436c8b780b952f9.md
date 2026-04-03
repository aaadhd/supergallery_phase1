# Artier's Pick 배지 부여/해제

최종 편집 일시: 2026년 3월 31일 오전 8:25
화면 모음: https://www.notion.so/3352df21a9a78124b0ebc155fe84354c, https://www.notion.so/3352df21a9a7817e9690cf72f952815b, https://www.notion.so/3352df21a9a781c6b21cc496828051f7,https://www.notion.so/3352df21a9a78103a67dd1f2df24bb0c, https://www.notion.so/3352df21a9a78126bf76c92dcabdd025, https://www.notion.so/3352df21a9a7817e9690cf72f952815b,https://www.notion.so/3352df21a9a78014b9dbd0937d318988, https://www.notion.so/3352df21a9a7811cb154e5b43cc1cdfb, https://www.notion.so/3352df21a9a7814c9f69c8f89e5b18f0, https://www.notion.so/3352df21a9a7817e9690cf72f952815b
📋 유저스토리 기반 WBS v2: 나는 작품 상세를 볼 때 작가 정보와 Artier's Pick 배지를 확인하고 싶다 (https://www.notion.so/Artier-s-Pick-3352df21a9a78132a39acfbca2473dc2?pvs=21), 나는 Artier's Pick 배지를 받으면 알림으로 알고 싶다 (작가 관점) (https://www.notion.so/Artier-s-Pick-3352df21a9a78165a399f8a8450a0c09?pvs=21), 나는 매주 Artier's Pick을 선정하여 우수 작품에 배지를 부여하고 싶다 (https://www.notion.so/Artier-s-Pick-3352df21a9a78193af90e12d4ea0016a?pvs=21)

> 운영팀이 주간 추천작을 선정하면 해당 작품에 Pick 배지를 자동 부여하고, 작가에게 알림을 발송하는 기능.
> 

> 운영 정책은 콘텐츠 운영 정책 참조.
> 

---

## 개요

어드민에서 작품 ID를 입력하면 Artier's Pick 배지가 해당 작품 카드 + 상세 모달에 영구 표시됨.

## 진입점

- 어드민 > Pick 관리 섹션 > 작품 ID 입력 → 배지 부여/해제

## 기능 상세

| 항목 | 내용 |
| --- | --- |
| 배지 부여 시점 | 어드민 처리 즉시 |
| 배지 노출 위치 | 작품 카드 + 상세 모달에 영구 표시 |
| 선정 수 | 주당 4~8점 |
| 노출 기간 | 해당 주 7일 (월~일) 주간 배너 고정 |
| 작가 알림 | 배지 부여 즉시 인앱 알림 + 이메일 자동 발송 |
| 배지 해제 | 어드민에서 수동 해제. 해제 후 작가 알림 없음 |

## 어드민 개발 스펙

- Pick 선정: `work_id` 입력 → `is_pick = true`, `pick_week` 저장
- 노출 기간 자동 해제: `pick_week` 기준 7일 경과 후 배너에서 제외
- 배지는 영구적으로 `is_pick = true` 유지

## 미결 사항

- [ ]  Pick 배지 디자인 (Figma)
- [x]  주간 노출 종료 후 배지 지속 여부 → **영구 표시** ✅ (시니어 창작자에게 "선정됐다"는 사실은 영구적 자부심 — 해당 주만 표시하면 의미가 희석됨)
- [x]  주간 배너 자동 교체 로직 → **수동 세팅** ✅ (자동 교체는 의도치 않은 노출 리스크 있음. 운영팀이 월요일 수동 세팅하는 것이 안전하고, 어드민 UI가 단순해 부담 없음)