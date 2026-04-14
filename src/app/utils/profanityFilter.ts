/**
 * 비속어 필터 (Phase 1 기본).
 * 닉네임·그룹명·전시명·태그 등에서 호출.
 *
 * 한계: 완벽한 사전·우회 탐지(자음 분리·띄어쓰기 등)는 비현실적 → Phase 2에 서버 사전 + 운영 신고로 보완.
 * 현 단계는 공개 커뮤니티 기본 허들로 흔한 욕·비하만 차단.
 */

// 영어 소문자·한글 기준. 공백은 제거 후 비교.
const BANNED: string[] = [
  // 한국어 욕설 (대표 표현)
  '씨발', '시발', 'ㅅㅂ', '시바',
  '개새끼', '개년', '개놈', '개자식',
  '좆', '좇', '자지', '보지',
  '병신', 'ㅄ', '븅신',
  '지랄', '미친놈', '미친년',
  '엿같', '엿먹',
  '새끼', // 단일로는 약하지만 모욕 맥락 다수
  '창녀', '걸레',
  '존나', '존ㄴ',
  // 혐오·비하 표현
  '한남', '한녀', '맘충', '급식충', '설명충', '틀딱',
  // 영어 흔한 욕설
  'fuck', 'shit', 'bitch', 'asshole', 'cunt', 'dick', 'faggot', 'nigger',
];

function normalize(input: string): string {
  return input.toLowerCase().replace(/\s+/g, '');
}

/** 감지된 비속어 목록을 반환. 비어 있으면 깨끗함. */
export function detectBannedWords(input: string): string[] {
  if (!input) return [];
  const s = normalize(input);
  const hits: string[] = [];
  for (const word of BANNED) {
    if (s.includes(word)) hits.push(word);
  }
  return hits;
}

/** 비속어가 포함되어 있는지 여부 */
export function containsProfanity(input: string): boolean {
  return detectBannedWords(input).length > 0;
}
