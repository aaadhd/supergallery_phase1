# [TECH] 소셜 OAuth 앱 등록 및 환경변수 세팅 (Kakao / Google / Apple)

EPIC: A: 인증/계정
P: P0
Sprint: Sprint 1
US-ID: TECH-A01
개발 순서: 2
화면 모음: 회원가입 / 로그인 (https://www.notion.so/3352df21a9a7812dae95ce3738e1782c?pvs=21), 로그인 화면 (https://www.notion.so/3352df21a9a780878f5ff3f68829ef1f?pvs=21), 소셜 로그인 화면 (https://www.notion.so/3352df21a9a780e8a943f9c60f4b43a1?pvs=21)
기간(일): 3
기능 모음: 소셜 로그인 (카카오/구글/애플) (https://www.notion.so/3362df21a9a78153a8edce4317ed6afa?pvs=21)
담당자: 한대환 (개발)
상태: ⬜ 미시작
인수 조건: • Kakao Developers 앱 등록: Redirect URI, 동의 항목 설정
• Google Cloud Console OAuth 2.0 클라이언트 생성 + Redirect URI 등록
• Apple Developer 시니어 인증 설정 (Sign in with Apple - Service ID, Key)
• 환경변수 정리: KAKAO_CLIENT_ID, GOOGLE_CLIENT_ID, APPLE_CLIENT_ID 등
• 개발/스테이징/프로드 환경변수 분리 .env 구성
• 한국(카카오)과 해외(구글/애플) 분기 동작 확인
페르소나: ⚫ 시스템
최종 편집 일시: 2026년 4월 2일 오전 1:43