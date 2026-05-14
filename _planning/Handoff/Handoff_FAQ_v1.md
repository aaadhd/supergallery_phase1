# FAQ 원고 (USR-INF-02)

**작성**: 기획 · **독자**: 개발(구현·QA)

`USR-INF-02` FAQ 화면에 노출되는 자주 묻는 질문 14문항 전문이다. **문구 의미·카테고리**만 고정한다. 아코디언 UX·검색 등 구현 세부는 PRD·구현 판단에 따른다.

> **단일 소스**
> - 화면 문자열(i18n)은 [Copy_v1.md](./Copy_v1.md) FAQ 영역이 단일 소스다.
> - 본 문서의 한글·영문은 Copy와 **같은 의미**를 유지하고, 수정 시 Copy를 먼저 갱신한 뒤 같은 작업 범위에서 본 문서를 맞춘다.

---

## 화면 구성 (USR-INF-02)

- **상단 제목**: 자주 묻는 질문 / Frequently asked questions
- **카테고리 필터**: 전체 / 계정 / 업로드 / 전시 / 기타 / 비회원 초대
- **본문**: 14문항 아코디언(Q 클릭 시 A 펼침)
- **하단 문의 유도**: "원하는 답변을 찾지 못하셨나요? [문의하기]" — `[문의하기]`는 `/contact` 링크

---

## FAQ 14문항 (한국어)

### 계정 카테고리

#### Q1. 가입은 어떻게 하나요?
홈 화면에서 로그인 버튼을 클릭하면 간편하게 가입할 수 있어요. 소셜 로그인(카카오, 구글, 애플)과 이메일 가입을 지원해요.

#### Q2. 로그인 링크 메일이 오지 않아요.
Proud Gallery는 비밀번호 대신 이메일 인증 링크로 로그인해요. 이메일을 받지 못했다면 스팸함을 먼저 확인해 주시고, 로그인 화면에서 "로그인 링크 다시 보내기"를 눌러 주세요. 30초 쿨다운 후 다시 보낼 수 있어요. 링크는 30분 동안 유효해요.

#### Q3. 탈퇴하면 작품은 어떻게 되나요?
탈퇴하면 업로드한 전시가 모두 삭제돼요. 복구할 수 없으니 남기고 싶은 작품은 탈퇴 전에 따로 저장해 두세요.

### 업로드 카테고리

#### Q4. 어떤 파일 형식을 지원하나요?
JPG, PNG, WEBP, GIF 형식을 지원하며, 파일당 최대 10MB까지 업로드할 수 있어요. 전시당 최대 10장의 이미지를 올릴 수 있어요.

#### Q5. 카메라로 찍은 사진도 올릴 수 있나요?
저작권 보호를 위해 카메라 촬영 사진(EXIF에 카메라 정보가 포함된 파일)은 업로드가 제한될 수 있어요. 직접 창작한 작품만 올려주세요.

#### Q6. 작품을 수정하거나 삭제할 수 있나요?
프로필 > 작품 탭에서 작품 우측 상단 메뉴(⋯)를 눌러 수정·삭제할 수 있어요.

### 전시 카테고리

#### Q7. 그룹 전시는 어떻게 만드나요?
업로드할 때 "함께 올리기"를 선택하면 그룹명을 입력하고 참여 작가를 한 자리씩 추가할 수 있어요. Proud Gallery 회원이면 이름을 검색해 바로 연결되고, 회원이 아닌 분은 이름만 입력해 자리를 만들어 두면 검수 통과 후 초대 링크로 직접 알릴 수 있어요.

#### Q8. Proud's Pick은 무엇인가요?
운영팀이 매주 우수 작품을 선정해 배지를 부여해요. 선정된 작품은 피드 상단에 노출되며, 작가에게 알림이 발송돼요.

### 기타 카테고리

#### Q9. 부적절한 작품을 발견했어요.
전시 상세 화면에서 신고 버튼(깃발 아이콘)을 눌러 신고할 수 있어요. 운영팀이 모든 신고를 직접 검토해요. 정책 위반이 확인되면 해당 작품을 비공개하거나 삭제 처리해요.

#### Q10. 서비스 이용료가 있나요?
현재 Proud Gallery의 모든 기능은 무료로 이용하실 수 있어요.

### 비회원 초대 카테고리

#### Q11. 함께 올린 비회원 작가는 어떻게 초대하나요?
전시를 발행하면 마이페이지의 전시 카드에 "비회원 작가에게 알리기" 버튼이 바로 생겨요. 검수 신청 단계부터 카카오톡·문자·이메일 등 평소 쓰시던 방법으로 비회원 작가에게 링크를 직접 보내주시면 돼요. 비회원 작가는 가입한 뒤 본인 작품 카드를 골라 연결할 수 있고, 검수가 통과되면 자동으로 공개돼요. 회사가 자동으로 발송하지는 않아요.

#### Q12. 비회원 작가가 가입했는데 작품이 자동으로 연결 안 됐어요.
가입 직후 "본인 작품 찾기" 화면에서 비회원 작가분이 본인 그림 카드를 직접 눌러야 연결돼요. "여기 없어요"를 눌러 건너뛰셨거나 다른 분 자리를 잘못 눌렀을 수 있어요. 비회원 작가분께 다시 한번 확인해 주세요.

#### Q13. 비회원 작가가 잘못된 자리에 연결됐어요. 어떻게 풀어요?
마이페이지에서 해당 전시 카드를 누르고 "수정"으로 들어가시면 각 자리의 작가를 다시 지정할 수 있어요. 자리를 풀면 "작가 미상"으로 표시되고, 비회원 작가분께 카톡 등으로 새 초대 링크를 다시 보내실 수 있어요.

#### Q14. 초대 링크는 언제까지 유효해요?
초대 링크는 발급일로부터 90일 동안 유효해요. 그 안에 비회원 작가가 가입하지 않으면 만료되고, 작가님이 마이페이지에서 새 링크를 다시 만들 수 있어요. 검수 대기·반려 중에는 링크가 일시 비활성 상태가 되고, 재승인되면 자동으로 다시 활성화돼요.

---

## FAQ 14 Questions (English)

### Account category

#### Q1. How do I sign up?
Tap the sign-in button on the home screen — it takes about a minute. We support social sign-in (Kakao, Google, Apple) and email sign-up.

#### Q2. I didn't receive the sign-in link email.
Proud Gallery uses email magic links instead of passwords. If you didn't receive the email, check your spam folder first, then tap "Resend sign-in link" on the sign-in screen. There's a 30-second cooldown, and the link is valid for 30 minutes.

#### Q3. What happens to my works if I delete my account?
All your uploaded exhibitions are deleted when you leave. This cannot be undone.

### Upload category

#### Q4. Which file formats are supported?
We support JPG, PNG, WEBP, and GIF up to 10MB per file, with up to 10 images per exhibition.

#### Q5. Can I upload photos taken with a camera?
To protect copyright, camera photos (with camera metadata in EXIF) may be blocked. Please upload work you created digitally.

#### Q6. Can I edit or delete a work?
Open Profile → Works and use the ⋯ menu on a work to edit or delete it.

### Exhibition category

#### Q7. How do I create a group exhibition?
When uploading, choose "Group exhibition" to enter a group name and add participating artists one by one. Members are linked instantly by name search; for non-members, just type their name to reserve a spot — once review passes, you can send them an invite link directly through your own channels.

#### Q8. What is Proud's Pick?
Our team selects outstanding works each week and awards a badge. Picked works appear higher in the feed and artists get a notification.

### Other category

#### Q9. I found inappropriate content.
Use the report button (flag) on the work detail screen. Our team reviews every report personally. If a violation is confirmed, the work will be hidden or removed.

#### Q10. Is there a fee?
All features of Proud Gallery are currently free to use.

### Non-member invite category

#### Q11. How do I invite non-member friends to my group exhibition?
As soon as you publish, the "Notify Non-member Artist" button appears on your exhibition card. From the review-pending stage, share the link with your friends through KakaoTalk, SMS, email, or any channel you usually use. After signing up, friends can claim their own slot, and the exhibition becomes public automatically once review passes — we don't send the link for you.

#### Q12. My friend signed up but their work isn't linked.
Right after signup, your friend has to tap their own work card on the "Find my work" screen for the link to happen. They may have skipped it, or tapped someone else's spot by mistake. Please ask them to check.

#### Q13. A friend got linked to the wrong spot. How do I fix it?
On My page, open the exhibition card and tap "Edit". You can re-assign the artist for each spot. Unlinking shows the spot as "Unknown artist", and you can send a new invite link to your friend.

#### Q14. How long is an invite link valid?
Invite links are valid for 90 days from issue. If your friend hasn't signed up by then, the link expires and you can create a new one from My page. While the exhibition is under review or rejected, the link is temporarily inactive — once re-approved, it becomes active again automatically.

---

## 문자열 출처

모든 UI 문구는 [Copy_v1.md](./Copy_v1.md) FAQ 영역을 따른다. 본 문서는 prose 참고용이며 i18n 키 목록은 적지 않는다.

---

## 구현 체크

- [ ] FAQ 14문항 전부 렌더링 (Q11~Q14는 [Policy §3](./Policy_v1.md#3-비회원-초대-정책) 토큰 모델 정합)
- [ ] 카테고리 필터 6종 동작 (전체·계정·업로드·전시·기타·비회원 초대)
- [ ] 하단 문의 링크 경로 `/contact`
- [ ] ko/en 동일 문항 수·동일 카테고리 (누락 검사)

---

## 문서 이력

| 버전 | 일자 | 작성 | 변경 내용 |
|------|------|------|----------|
| v5 | 2026-05-14 | PM × Claude | Q11~14 "친구" → "비회원 작가" 용어 전체 변경(KO) |
| v4 | 2026-05-09 | PM × Claude | Q9 신고 처리 문구 완화 — SLA 제거, 운영팀 직접 검토·비공개·삭제 처리 안내로 교체(KO·EN) |
| v3 | 2026-05-07 | PM × Claude | Artier→Proud Gallery·Proud's Pick 브랜드 정합(KO·EN 전체 7곳) |
| v2 | 2026-05-01 | PM × Claude | 본문 보강 — 14문항 ko/en 전문 게재. 카테고리별 묶음(계정/업로드/전시/기타/비회원 초대). **Q6 콘텐츠 결함 정정** — Phase 1엔 없는 회원용 비공개 토글을 약속하던 문장 ko/en 삭제. |
<!-- 인용 정의 -->
[Copy_v1.md]: Copy_v1.md
[Policy §3]: Policy_v1.md#3-비회원-초대-정책
