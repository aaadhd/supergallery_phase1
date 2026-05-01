# FAQ 원고 v2 (개발·운영 전달용)

`USR-INF-02` FAQ 화면에 노출되는 자주 묻는 질문 14문항 전문.

> **단일 소스 안내**
> - 코드(i18n) 단일 소스: [`Copy_v1.md`](Copy_v1.md) `faq.*` 키
> - 본 문서는 동일 내용을 prose 형태로 정리한 **핸드오프 보조본**이다(개발사·운영팀·UX Writer가 화면을 보지 않고도 전체 흐름을 파악하도록).
> - 카피 변경은 [`Copy_v1.md`](Copy_v1.md)와 본 문서를 같은 작업 범위에서 동시 갱신한다.

---

## 화면 구성 (USR-INF-02)

- **상단 제목**: 자주 묻는 질문 / Frequently asked questions (`faq.title`)
- **카테고리 필터**: 전체 / 계정 / 업로드 / 전시 / 기타 (`faq.cat*`)
- **본문**: 14문항 아코디언 형태 (Q 클릭 시 A 펼침)
- **하단 문의 유도**: "원하는 답변을 찾지 못하셨나요? [문의하기]" → `/contact` 이동 (`faq.contactLead` + `faq.contactLink`)

---

## FAQ 14문항 (한국어)

### 계정 카테고리

#### Q1. 가입은 어떻게 하나요?
홈 화면에서 로그인 버튼을 클릭하면 간편하게 가입할 수 있습니다. 소셜 로그인(카카오, 구글, 애플)과 이메일 가입을 지원합니다.

#### Q2. 로그인 링크 메일이 오지 않아요.
Artier는 비밀번호 대신 이메일 인증 링크로 로그인합니다. 이메일을 받지 못했다면 스팸함을 먼저 확인해 주시고, 로그인 화면에서 "로그인 링크 다시 보내기"를 눌러 주세요. 30초 쿨다운 후 재발송이 가능합니다. 링크는 30분 동안 유효합니다.

#### Q3. 탈퇴하면 작품은 어떻게 되나요?
탈퇴 후에도 업로드한 작품은 "작가 미상"으로 갤러리에 유지됩니다. 탈퇴 전 작품 삭제를 원하시면 먼저 작품을 개별 삭제해 주세요.

### 업로드 카테고리

#### Q4. 어떤 파일 형식을 지원하나요?
JPG, PNG, WEBP, GIF 형식을 지원하며, 파일당 최대 10MB까지 업로드할 수 있습니다. 전시당 최대 10장의 이미지를 올릴 수 있습니다.

#### Q5. 카메라로 찍은 사진도 올릴 수 있나요?
저작권 보호를 위해 카메라 촬영 사진(EXIF에 카메라 정보가 포함된 파일)은 업로드가 제한될 수 있습니다. 직접 창작한 작품만 올려주세요.

#### Q6. 작품을 수정하거나 삭제할 수 있나요?
프로필 > 작품 탭에서 작품 우측 상단 메뉴(⋯)를 통해 수정 및 삭제가 가능합니다. 비공개로 전환하면 피드에서만 숨길 수 있습니다.

### 전시 카테고리

#### Q7. 그룹 전시는 어떻게 만드나요?
업로드할 때 "함께 올리기"를 선택하면 그룹명을 입력하고 참여 작가를 한 자리씩 추가할 수 있어요. Artier 회원이면 이름을 검색해 바로 연결되고, 회원이 아닌 분은 이름만 입력해 자리를 만들어 두면 검수 통과 후 초대 링크로 직접 알릴 수 있어요.

#### Q8. Artier's Pick은 무엇인가요?
운영팀이 매주 우수 작품을 선정하여 배지를 부여합니다. 선정된 작품은 피드 상단에 노출되며, 작가에게 알림이 발송됩니다.

### 기타 카테고리

#### Q9. 부적절한 작품을 발견했어요.
전시 상세 화면에서 신고 버튼(깃발 아이콘)을 눌러 신고할 수 있습니다. 운영팀이 영업일 24시간 안에 확인해드려요.

#### Q10. 서비스 이용료가 있나요?
현재 Artier의 모든 기능은 무료로 이용하실 수 있습니다.

### 비회원 초대 카테고리 (Policy v2.14 토큰 모델)

#### Q11. 함께 올린 비회원 친구는 어떻게 초대하나요?
검수가 통과되면 마이페이지의 전시 카드에 "친구에게 알리기" 버튼이 활성화돼요. 카카오톡·문자·이메일 등 평소 쓰시던 방법으로 친구에게 링크를 직접 보내주시면 됩니다. 회사가 자동으로 발송하지는 않아요.

#### Q12. 친구가 가입했는데 작품이 자동으로 연결 안 됐어요.
가입 직후 "본인 작품 찾기" 화면에서 친구분이 본인 그림 카드를 직접 눌러야 연결돼요. "여기 없어요"를 눌러 건너뛰셨거나 다른 분 자리를 잘못 눌렀을 수 있어요. 친구분께 다시 한번 확인해 주세요.

#### Q13. 친구가 잘못된 자리에 연결됐어요. 어떻게 풀어요?
마이페이지에서 해당 전시 카드를 누르고 "수정"으로 들어가시면 각 자리의 작가를 다시 지정할 수 있어요. 자리를 풀면 "작가 미상"으로 표시되고, 친구분께 카톡 등으로 새 초대 링크를 다시 보내실 수 있어요.

#### Q14. 초대 링크는 언제까지 유효해요?
초대 링크는 발급일로부터 90일 동안 유효해요. 그 안에 친구가 가입하지 않으면 만료되고, 작가님이 마이페이지에서 새 링크를 다시 만들 수 있어요. 검수 대기·반려 중에는 링크가 일시 비활성 상태가 되고, 재승인되면 자동으로 다시 활성화돼요.

---

## FAQ 14 Questions (English)

### Account category

#### Q1. How do I sign up?
Tap the sign-in button on the home screen — it takes about a minute. We support social sign-in (Kakao, Google, Apple) and email sign-up.

#### Q2. I didn't receive the sign-in link email.
Artier uses email magic links instead of passwords. If you didn't receive the email, check your spam folder first, then tap "Resend sign-in link" on the sign-in screen. There's a 30-second cooldown, and the link is valid for 30 minutes.

#### Q3. What happens to my works if I delete my account?
After you leave, your uploaded works stay in the gallery under "Unknown artist". If you want them removed, please delete each work individually before you leave.

### Upload category

#### Q4. Which file formats are supported?
We support JPG, PNG, WEBP, and GIF up to 10MB per file, with up to 10 images per exhibition.

#### Q5. Can I upload photos taken with a camera?
To protect copyright, camera photos (with camera metadata in EXIF) may be blocked. Please upload work you created digitally.

#### Q6. Can I edit or delete a work?
Open Profile → Works and use the ⋯ menu on a work to edit or delete. Setting a work to private hides it from the feed only.

### Exhibition category

#### Q7. How do I create a group exhibition?
When uploading, choose "Group exhibition" to enter a group name and add participating artists one by one. Members are linked instantly by name search; for non-members, just type their name to reserve a spot — once review passes, you can send them an invite link directly through your own channels.

#### Q8. What is Artier's Pick?
Our team selects outstanding works each week and awards a badge. Picked works appear higher in the feed and artists get a notification.

### Other category

#### Q9. I found inappropriate content.
Use the report button (flag) on the work detail screen. We review reports within 24 business hours.

#### Q10. Is there a fee?
All features of Artier are currently free to use.

### Non-member invite category (Policy v2.14 token model)

#### Q11. How do I invite non-member friends to my group exhibition?
Once your exhibition passes review, the "Tell a friend" button on your My page becomes active. Send the link to friends through KakaoTalk, SMS, email, or any channel you usually use — we don't send it for you.

#### Q12. My friend signed up but their work isn't linked.
Right after signup, your friend has to tap their own work card on the "Find my work" screen for the link to happen. They may have skipped it, or tapped someone else's spot by mistake. Please ask them to check.

#### Q13. A friend got linked to the wrong spot. How do I fix it?
On My page, open the exhibition card and tap "Edit". You can re-assign the artist for each spot. Unlinking shows the spot as "Unknown artist", and you can send a new invite link to your friend.

#### Q14. How long is an invite link valid?
Invite links are valid for 90 days from issue. If your friend hasn't signed up by then, the link expires and you can create a new one from My page. While the exhibition is under review or rejected, the link is temporarily inactive — once re-approved, it becomes active again automatically.

---

## 적용 키 (코드 동기화 매핑)

- **카테고리**: `faq.catAll`, `faq.catAccount`, `faq.catUpload`, `faq.catExhibition`, `faq.catOther`
- **제목**: `faq.title`
- **문항·답변**: `faq.q1`~`faq.q14` / `faq.a1`~`faq.a14`
- **문의 유도**: `faq.contactLead`, `faq.contactLink`

---

## 구현 체크

- [ ] FAQ 14문항 전부 키로 렌더링 (q11~q14는 Policy §3 v2.14 토큰 모델 정합)
- [ ] 카테고리 필터 5종 동작 (전체·계정·업로드·전시·기타)
- [ ] 하단 문의 링크 `/contact` 이동
- [ ] ko/en 양측 동일 문항 수·동일 카테고리 노출 (i18n 누락 검사)

---

## 문서 이력

| 버전 | 일자 | 작성 | 변경 내용 |
|------|------|------|----------|
| v2 | 2026-05-01 | PM × Claude | 본문 보강 — 키 목록 + 체크 위주에서 14문항 ko/en 전문 게재로 확장. 카테고리별로 묶음(계정/업로드/전시/기타/비회원 초대). q11~q14(Policy v2.14 토큰 모델)와 q7 정정 문구 반영. 핸드오프 보조본 성격 명시. |
| v1 | 2026-04-26 | PM | 최초 작성 — 적용 키 목록 + 구현 체크 포인트만 정리. 본문은 `Copy_v1.md` 단일 소스 위임. |
