import type { Locale } from './uiStrings';

const ko = {
  title: '이용약관',
  effective: '시행일: 2026년 5월 1일',
  art1h: '제1조 (목적)',
  art1p:
    '이 약관은 Artier(이하 "서비스")가 제공하는 디지털 갤러리 서비스의 이용조건 및 절차, 회사와 회원 간의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.',
  art2h: '제2조 (정의)',
  art2p:
    '"회원"이란 서비스에 가입하여 이용계약을 체결한 자를 말합니다. "작품"이란 회원이 서비스에 업로드한 이미지 및 관련 정보를 말합니다. "전시"란 하나 이상의 작품으로 구성된 갤러리 단위를 말합니다.',
  art3h: '제3조 (서비스 이용)',
  art3p:
    '서비스는 작품의 업로드, 전시, 열람, 좋아요, 저장, 공유 등의 기능을 제공합니다. 서비스 이용 중 타인의 저작권을 침해하는 행위는 금지됩니다.',
  art4h: '제4조 (저작권)',
  art4p1a: '회원이 업로드한 작품의 저작권은 해당 회원에게 귀속됩니다. Phase 1에서는 모든 작품에 ',
  art4p1b:
    '가 기본 적용되며, Creative Commons 등 별도 라이선스 선택 UI는 Phase 2에서 제공될 수 있습니다.',
  art4p2:
    '회원은 서비스에 작품을 게시함으로써, 서비스 운영·피드 노출·썸네일·알림·링크 미리보기·검색 색인 등 서비스 제공에 필요한 범위에서 회사가 작품을 이용할 수 있음에 동의합니다. 회사는 원작자 동의 없이 수정·재판매하거나 약관이 정한 범위를 벗어난 상업적 이용을 하지 않습니다.',
  art4note:
    '이미지 직접 저장(다운로드)은 UI에서 제공하지 않습니다. 스크린샷 등은 기술적으로 차단할 수 없음을 안내합니다.',
  art5h: '제5조 (면책조항)',
  art5p: '서비스는 회원 간 또는 회원과 제3자 간의 분쟁에 대해 개입하지 않으며, 이에 대한 책임을 부담하지 않습니다.',
  footerNote: '본 약관은 서비스 정식 런칭 전 초안이며, 법무 검토를 거쳐 최종 확정됩니다.',
} as const;

export type TermsContentKey = keyof typeof ko;

const en: Record<keyof typeof ko, string> = {
  title: 'Terms of Service',
  effective: 'Effective: May 1, 2026',
  art1h: 'Article 1 (Purpose)',
  art1p:
    'These terms set forth the conditions and procedures for using the digital gallery service provided by Artier (the “Service”), and the rights, obligations, and responsibilities between the company and members.',
  art2h: 'Article 2 (Definitions)',
  art2p:
    '“Member” means a person who registers and enters into a use agreement with the Service. “Work” means images and related information uploaded by a member. “Exhibition” means a gallery unit consisting of one or more works.',
  art3h: 'Article 3 (Use of the Service)',
  art3p:
    'The Service provides features such as uploading works, exhibitions, viewing, likes, saves, and sharing. Infringing others’ copyrights while using the Service is prohibited.',
  art4h: 'Article 4 (Copyright)',
  art4p1a:
    'Copyright in works uploaded by a member remains with that member. In Phase 1, ',
  art4p1b:
    ' applies by default to all works; optional license selection (e.g. Creative Commons) may be offered in Phase 2.',
  art4p2:
    'By posting works, members agree that the company may use them as needed to operate the Service, including feed display, thumbnails, notifications, link previews, and search indexing. The company will not modify or resell works without the creator’s consent or use them commercially beyond these terms.',
  art4note:
    'Direct image download is not provided in the UI. Screenshots and similar cannot be fully prevented technically.',
  art5h: 'Article 5 (Disclaimer)',
  art5p:
    'The Service does not intervene in disputes between members or between members and third parties, and assumes no liability for them.',
  footerNote:
    'These terms are a draft prior to official launch and will be finalized after legal review.',
};

export function tTerms(locale: Locale, key: TermsContentKey): string {
  if (locale === 'en') return en[key];
  return ko[key];
}
