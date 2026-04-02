import type { Locale } from './uiStrings';

const ko = {
  title: '개인정보처리방침',
  effective: '시행일: 2026년 5월 1일',
  s1h: '1. 수집하는 개인정보 항목',
  s1p:
    '서비스는 회원가입 및 서비스 이용을 위해 다음의 개인정보를 수집합니다: 이메일 주소, 작가명(닉네임), 프로필 이미지, 자기소개, 국가 정보.',
  s2h: '2. 개인정보의 수집·이용 목적',
  s2p:
    '회원 식별 및 인증, 서비스 제공 및 개선, 이벤트 안내, 법적 의무 이행을 위해 개인정보를 수집·이용합니다.',
  s3h: '3. 개인정보의 보유 및 이용기간',
  s3p:
    '회원 탈퇴 시 지체 없이 파기합니다. 다만, 관련 법령에 의해 보존이 필요한 경우 해당 법령에서 정한 기간 동안 보관합니다.',
  s4h: '4. 개인정보의 제3자 제공',
  s4p: '회원의 동의 없이 개인정보를 제3자에게 제공하지 않습니다. 다만, 법령에 의해 요구되는 경우에는 예외로 합니다.',
  s5h: '5. 개인정보 보호책임자',
  s5p: '개인정보 보호에 관한 문의는 support@artier.com으로 연락해 주시기 바랍니다.',
  footer: '본 방침은 서비스 정식 런칭 전 초안이며, 법무 검토를 거쳐 최종 확정됩니다.',
} as const;

export type PrivacyContentKey = keyof typeof ko;

const en: Record<PrivacyContentKey, string> = {
  title: 'Privacy Policy',
  effective: 'Effective: May 1, 2026',
  s1h: '1. Personal information we collect',
  s1p:
    'To register and use the Service, we may collect: email address, artist name (nickname), profile image, bio, and country/region.',
  s2h: '2. Purposes of collection and use',
  s2p:
    'We use personal information to identify members, provide and improve the Service, share event information, and meet legal obligations.',
  s3h: '3. Retention',
  s3p:
    'We delete personal information without undue delay when you delete your account, except where applicable law requires a longer retention period.',
  s4h: '4. Sharing with third parties',
  s4p:
    'We do not share personal information with third parties without consent, except where required by law.',
  s5h: '5. Data protection contact',
  s5p: 'For privacy inquiries, contact support@artier.com.',
  footer:
    'This policy is a draft prior to official launch and will be finalized after legal review.',
};

export function tPrivacy(locale: Locale, key: PrivacyContentKey): string {
  if (locale === 'en') return en[key];
  return ko[key];
}
