# 작품 수정 / 삭제

정책 모음: https://www.notion.so/3342df21a9a781cdb58fcff50720b990
최종 편집 일시: 2026년 3월 31일 오후 3:26
화면 모음: https://www.notion.so/3352df21a9a78037af3ce1c436ceaa0c, https://www.notion.so/3352df21a9a780ecba27eaabb1c60bb2, https://www.notion.so/3352df21a9a781278708ccc1dcf1cfcc, https://www.notion.so/3352df21a9a781a2ba7fcbd716998c2f,https://www.notion.so/3352df21a9a78037af3ce1c436ceaa0c, https://www.notion.so/3352df21a9a7804baf76ed3ec93b792d, https://www.notion.so/3352df21a9a7806b81f1c517b5261074, https://www.notion.so/3352df21a9a780cabba6e6786e7252f1, https://www.notion.so/3352df21a9a780ea8820ef2369070399, https://www.notion.so/3352df21a9a780ecba27eaabb1c60bb2, https://www.notion.so/3352df21a9a781278708ccc1dcf1cfcc,https://www.notion.so/3352df21a9a78037af3ce1c436ceaa0c, https://www.notion.so/3352df21a9a78093b7d3ec394116a2b0, https://www.notion.so/3352df21a9a781278708ccc1dcf1cfcc, https://www.notion.so/3352df21a9a781a2ba7fcbd716998c2f
📋 유저스토리 기반 WBS v2: 나는 특정 작품을 일시적으로 비공개로 바꿀 수 있어야 한다 (https://www.notion.so/3352df21a9a781a1b09ddaeae4bacb00?pvs=21), 나는 내 프로필 페이지에서 내 전시·작품·좋아요·저장·초안을 한눈에 관리하고 싶다 (https://www.notion.so/3352df21a9a781a2b284f8bf654ed68c?pvs=21), 나는 올린 작품을 수정하거나 삭제할 수 있어야 한다 (https://www.notion.so/3352df21a9a781cd9094d986589f2ccc?pvs=21)

## 개요

업로드한 작품의 정보를 수정하거나 삭제하는 기능.

## 진입점

- 내 프로필 > **전시 탭** 또는 **작품 관리 탭** > 작품 카드 `...` 메뉴
- 작업물 상세 모달 내 `...` 메뉴 (본인만)

## 수정 가능 영역

| 항목 | 수정 가능 여부 | 비고 |
| --- | --- | --- |
| 전시명 | ✅ | 1장 전시의 경우 수정 시 작품명도 자동 변경 |
| 작품명 | ✅ | 선택 입력. 미입력 시 규칙에 따라 자동 처리. 직접 입력 시 입력값 사용 |
| 설명 | ✅ |  |
| 카테고리 | ❌ Phase 2 | Phase 1 미지원 항목 |
| 이미지 | ✅ | 이미지 수 변경 시 작품명 자동 재처리 (1장↔여러 장 전환 시 재적용) |
| 공개 범위 | ✅ |  |

## 작품명 자동 처리 규칙 (미입력 시)

| 케이스 | 작품명 자동 처리 |
| --- | --- |
| 1명, 1장 업로드 | 전시명 자동 적용 |
| 1명, 여러 장 업로드 | 무제 |
| 그룹전시 | 무제 |

> 직접 입력 시 모든 케이스에서 입력값 우선 적용.
> 

## 삭제 정책

| 항목 | 내용 |
| --- | --- |
| 삭제 권한 | 본인만 가능 |
| 삭제 시 확인 | "삭제하면 복구할 수 없습니다" 확인 다이얼로그 |
| 데이터 처리 | 영구 삭제 (확정) |
| 좋아요 데이터 | 삭제 시 함께 삭제 |
| 그룹전시에 제출된 작품 | 삭제 시 전시에서도 제거 |

## 비공개 전환 정책

| 항목 | 내용 |
| --- | --- |
| 진입점 | 내 프로필 > 작품 관리 탭 > `...` 메뉴 > 비공개로 설정 |
| 비공개 처리 시 | `Exhibition.status = hidden` 으로 변경 |
| 피드 제거 로직 | 피드 쿼리 조건: `status = approved` 인 전시만 노출 → `hidden` 상태는 자동 제외 |
| 본인 프로필 | 비공개 전환 후에도 본인에게는 노출 유지 (비공개 뱃지 표시) |
| 재공개 | `...` 메뉴 > 공개로 설정 → `status = approved` 복원 |
| 어드민 비공개 | 어드민 > 작품 관리에서도 동일 status 처리. 작가에게 알림 발송 |

## 미결 사항

- [x]  삭제 시 데이터 처리 방식 → **영구 삭제 확정** ✅
- [x]  그룹전시 제출작 삭제 시 업로더 알림 여부 → **알림 발송** ✅ (개설자가 모르면 전시에 빈칸이 생길 수 있음. 속보로 대응 가능하게 해줘야 함)
- [x]  비공개 전환 status 처리 → **`Exhibition.status = hidden`** ✅ (피드 쿼리는 `status = approved` 조건으로 자동 제외됨)