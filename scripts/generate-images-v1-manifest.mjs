#!/usr/bin/env node
/**
 * public/images_1/<folder>/<file> → src/app/data/imagesV1Manifest.json
 *
 * 폴더 = 작가 1명. 폴더 안 이미지 파일 중
 *  - 프로필/인물/작가 사진: artist.avatar
 *  - 출품 신청서 스캔(001.jpg, "신청서", "양식"): 제외
 *  - 나머지: 전시 구성 작품 이미지(최대 10장)
 *
 * pnpm exec node scripts/generate-images-v1-manifest.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const baseDir = path.join(root, 'public', 'images_1');
const out = path.join(root, 'src', 'app', 'data', 'imagesV1Manifest.json');

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

/** 폴더 → 작가 메타. 폴더명이 규칙적이지 않은 경우 여기 명시. */
const FOLDER_META = {
  '구월': { artistName: '구월', exhibitionName: '구월 개인전' },
  '구카': { artistName: '구카', bio: '지극히 개인적인 것들로 마음을 사로잡는 순간을 그려요', exhibitionName: '구카 개인전' },
  '김승혜 작가': { artistName: '달뜰리에(김승혜)', bio: '소망 담아 따뜻하게 행복민화를 그려요', exhibitionName: '장생마을 연작전' },
  '김아흔-동그라미': { artistName: '김아흔', exhibitionName: '동그라미 일러스트 모음전' },
  '김안예 작가': { artistName: '김안예', exhibitionName: '김안예 일러스트 개인전' },
  '김원미': { artistName: '김원미', exhibitionName: '김원미 개인전' },
  '김정숙_모바일아트협동조합': { artistName: '김정숙', groupName: '모바일아트협동조합', exhibitionName: '모바일아트협동조합 정기전 — 김정숙' },
  '김현경_시니어힐링컬러링북저자': { artistName: '김현경', bio: '시니어 힐링 컬러링북 저자', exhibitionName: '컬러링북 아티스트 개인전' },
  '나랑하루 작품전달 내용': { artistName: '나랑하루', exhibitionName: '나랑하루 개인전' },
  '문창규_모바일아트협동조합': { artistName: '문창규', groupName: '모바일아트협동조합', exhibitionName: '모바일아트협동조합 정기전 — 문창규' },
  '박경인_이나트': { artistName: '박경인', groupName: '이나트', exhibitionName: '이나트 일러스트 전시' },
  '박소영_일러스트': { artistName: '박소영', exhibitionName: '박소영 일러스트 전시' },
  '박인숙_도로시아트': { artistName: '박인숙', groupName: '도로시아트', exhibitionName: '도로시아트 개인전' },
  '블룸스토리.김슬기': { artistName: '블룸스토리(김슬기)', exhibitionName: '블룸스토리 수채 일러스트 전' },
  '사니수니': { artistName: '사니수니', exhibitionName: '사니수니 개인전' },
  '성순임_모바일아트협동조합': { artistName: '성순임', groupName: '모바일아트협동조합', exhibitionName: '모바일아트협동조합 정기전 — 성순임' },
  '송덕성_모바일아트협동조합': { artistName: '송덕성', groupName: '모바일아트협동조합', exhibitionName: '모바일아트협동조합 정기전 — 송덕성' },
  '심순옥_모바일아트협동조합': { artistName: '심순옥', groupName: '모바일아트협동조합', exhibitionName: '모바일아트협동조합 정기전 — 심순옥' },
  '양주감동모바일아트 김애숙_모바일아트협동조합': { artistName: '김애숙', groupName: '양주감동모바일아트', exhibitionName: '양주감동모바일아트 5점 연작 — 김애숙' },
  '양주감동모바일아트 박혜정_모바일아트협동조합': { artistName: '박혜정', groupName: '양주감동모바일아트', exhibitionName: '양주감동모바일아트 5점 연작 — 박혜정' },
  '양주감동모바일아트 박혜진_모바일아트협동조합': { artistName: '박혜진', groupName: '양주감동모바일아트', exhibitionName: '양주감동모바일아트 5점 연작 — 박혜진' },
  '양주감동모바일아트 조영식_모바일아트협동조합': { artistName: '조영식', groupName: '양주감동모바일아트', exhibitionName: '양주감동모바일아트 4점 연작 — 조영식' },
  '양주감동모바일아트 최창수_모바일아트협동조합': { artistName: '최창수', groupName: '양주감동모바일아트', exhibitionName: '양주감동모바일아트 5점 연작 — 최창수' },
  '염지원(풍선몰리)': { artistName: '풍선몰리', bio: '작은 순간이 머물러, 따뜻한 위로가 되기를', exhibitionName: '풍선몰리 일상 일러스트 전' },
  '윤정화_강사': { artistName: '윤정화', isInstructor: true, exhibitionName: '윤정화 강사 작품전' },
  '이고은': { artistName: '이고은', exhibitionName: 'Light Series — 빛의 여정' },
  '이종진_모바일아트협동조합': { artistName: '이종진', groupName: '모바일아트협동조합', exhibitionName: '모바일아트협동조합 정기전 — 이종진' },
  '이후정_모바일아트협동조합': { artistName: '이후정', groupName: '모바일아트협동조합', exhibitionName: '모바일아트협동조합 정기전 — 이후정' },
  '일루몽': { artistName: '일루몽', exhibitionName: '일루몽 일러스트 전' },
  '임명혁_모바일아트협동조합': { artistName: '임명혁', groupName: '모바일아트협동조합', exhibitionName: '모바일아트협동조합 정기전 — 임명혁' },
  '장귀순_모바일아트협동조합_67세': { artistName: '장귀순', groupName: '모바일아트협동조합', bio: '67세 — 모바일아트협동조합', exhibitionName: '모바일아트협동조합 정기전 — 장귀순' },
  '장봉윤_모바일아티스트협동조합': { artistName: '장봉윤', groupName: '모바일아티스트협동조합', exhibitionName: '장봉윤 디지털 페인팅 개인전' },
  '전혜란_퀴니': { artistName: '퀴니(Quini)', bio: '추억 가득한 일상의 감성을 디지털 드로잉으로 담아내는 작가', exhibitionName: 'Quini 디지털 드로잉 모음전' },
  '정병길_모바일아트협동조합': { artistName: '정병길', groupName: '모바일아트협동조합', bio: '모바일아트협동조합 대표, 70대', exhibitionName: '모바일아트협동조합 정기전 — 정병길' },
  '최은옥_모바일아트협동조합': { artistName: '최은옥', groupName: '모바일아트협동조합', exhibitionName: '모바일아트협동조합 정기전 — 최은옥' },
  '허자영': { artistName: '허자영', exhibitionName: '허자영 개인전' },
  '황서현': { artistName: '황서현', exhibitionName: '황서현 개인전' },
};

/** 프로필·인물 사진으로 판단할 파일명 패턴 */
const PROFILE_PATTERNS = [
  /프로필/i,
  /인물[_ ]?사진/i,
  /작가[_ ]?사진/i,
  /작가[_ ]?프로필/i,
  /장가계에서/i, // 장봉윤
];

/** 제외(출품 신청서 등) */
const EXCLUDE_PATTERNS = [
  /출품[_ ]?신청서/i,
  /신청서/i,
  /출품양식/i,
  /출품[_ ]?양식/i,
  /getImage/i, // 최은옥_모바일아트협동조합/1500_getImage.png (불투명 배경 썸네일)
];

/** 특정 파일이 실질적으로 작가 사진인데 패턴에 안 걸리는 경우 명시 */
const FORCE_PROFILE_BY_PATH = new Set([
  '심순옥_모바일아트협동조합/심순옥 002.jpg',
  '성순임_모바일아트협동조합/성순임1.jpg',
  '임명혁_모바일아트협동조합/임명혁 사진.jpg',
  '정병길_모바일아트협동조합/정병길_모바일아트협동조합(대표)_70대.jpg',
  '이후정_모바일아트협동조합/작가사진(이후정).jpg',
  '장귀순_모바일아트협동조합_67세/장귀순님.jpg',
  '김정숙_모바일아트협동조합/김정숙 프로필.jpg',
  '양주감동모바일아트 김애숙_모바일아트협동조합/김애숙 사진.png',
  '양주감동모바일아트 박혜정_모바일아트협동조합/박혜정 사진.png',
  '양주감동모바일아트 박혜진_모바일아트협동조합/박혜진 사진.png',
  '양주감동모바일아트 조영식_모바일아트협동조합/조영식 사진.png',
  '양주감동모바일아트 최창수_모바일아트협동조합/최창수 사진.png',
  '사니수니/프로필 이미지.jpeg',
  '사니수니/프로필 정보.jpg',
]);

/** 특정 숫자-only / 의미 없는 파일명 수동 타이틀 */
const EXPLICIT_TITLES = {
  '블룸스토리.김슬기/블룸스토리.김슬기/43.jpg': '하늘과 바다 사이',
  '블룸스토리.김슬기/블룸스토리.김슬기/65.jpg': '한옥 너머, 남산 서울타워',
  '블룸스토리.김슬기/블룸스토리.김슬기/123.jpg': '구름바다 위 관람차',
  '블룸스토리.김슬기/블룸스토리.김슬기/125.jpg': '별이 내리는 밤, 피아노',
  '블룸스토리.김슬기/블룸스토리.김슬기/128.jpg': '물가에 핀 비밀의 정원',
  '블룸스토리.김슬기/블룸스토리.김슬기/129.jpg': '세상에서 가장 따뜻한 품',
  '블룸스토리.김슬기/블룸스토리.김슬기/130.jpg': '노을빛 언덕 위 풍차',
  '블룸스토리.김슬기/블룸스토리.김슬기/134.jpg': '나만의 작은 쉼터',
  '블룸스토리.김슬기/블룸스토리.김슬기/142.jpg': '하얀 언덕의 정원',
  '블룸스토리.김슬기/블룸스토리.김슬기/144.jpg': '별빛 고래의 밤',
  '심순옥_모바일아트협동조합/1775923257007.png': '푸른 정원',
  '심순옥_모바일아트협동조합/1775923311219.png': '분홍빛 숲',
  '심순옥_모바일아트협동조합/1775924694594.png': '여름의 기억',
  '심순옥_모바일아트협동조합/1775925623418.png': '노을 풍경',
  '심순옥_모바일아트협동조합/1775927880654.png': '고요한 오후',
  '심순옥_모바일아트협동조합/20260413_215225.jpg': '봄의 문턱',
  '이종진_모바일아트협동조합/image01.png': '고요한 풍경',
};

function cleanTitle(filename, folderMeta) {
  const explicitKey = folderMeta.__relPath; // set below
  if (EXPLICIT_TITLES[explicitKey]) return EXPLICIT_TITLES[explicitKey];

  let t = filename.replace(/\.(jpe?g|png|webp|gif)$/i, '').trim();

  // 앞쪽 "N." "N -" "N_" 제거 (공백·점·대시·언더스코어 여러 개 허용)
  t = t.replace(/^\d+\s*[._\-]+\s*/, '');
  // "[작가명]" 대괄호 프리픽스 제거
  t = t.replace(/^\[[^\]]+\]\s*/, '');

  // 작가명_ 또는 작가명- 프리픽스 제거
  const nameCandidates = [folderMeta.artistName, folderMeta.artistName?.replace(/\(.*\)$/, '').trim()].filter(Boolean);
  for (const name of nameCandidates) {
    // "작가명 - " / "작가명- " / "작가명-"
    const re = new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s_\\-\\.]+`);
    t = t.replace(re, '');
    // "작가명" 을 포함한 프리픽스 숫자 조합: "1-김애숙-" 같은 패턴
    const re2 = new RegExp(`^\\d+[\\s\\-_.]+${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s_\\-\\.]+`);
    t = t.replace(re2, '');
  }

  // 치수 정보 제거: " 65.0x31.9cm", "-2048X1584 300dpi -10호P"
  t = t.replace(/[\s\-]+[\d.]+\s*[xX×]\s*[\d.]+(\s*cm|\s*\d+\s*dpi)?(\s*[-–—]?\s*\d*\s*호P?)?.*$/u, '');
  // 콤마 이하 매체 설명 제거: ", Digital painting on canvas, 2024"
  t = t.replace(/,\s*[Dd]igital\s+(print|painting).*$/i, '');
  t = t.replace(/,\s*\d{4}\s*$/, '');
  // "-설명" 긴 꼬리 반복 제거 (예: "침략 전쟁-화염이 터지는 전장의 모습을 표현-1"
  //   → "침략 전쟁-1" → "침략 전쟁")
  for (let i = 0; i < 4; i++) {
    const prev = t;
    // 끝의 "-숫자"·"-한 자"는 먼저 절단
    t = t.replace(/\s*[-–—]\s*\d+\s*$/u, '').trim();
    // 긴 설명구(16자 이상) 꼬리 절단
    t = t.replace(/\s*[-–—]\s*[^-–—]{16,}$/u, '').trim();
    if (t === prev) break;
  }
  // "N작가명-" (숫자+작가명 붙어있는 경우) 프리픽스 제거 — e.g. "3조영식-"
  for (const name of nameCandidates) {
    const re = new RegExp(`^\\d+${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s_\\-\\.]+`);
    t = t.replace(re, '');
  }
  // 끝에 "_작가명" 제거
  for (const name of nameCandidates) {
    const re = new RegExp(`[_\\s]*${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`);
    t = t.replace(re, '');
  }
  // 숫자-only 또는 "0", "1" 같은 빈껍데기는 빈 문자열
  if (/^\d+$/.test(t)) return '';
  // 파일 해시/타임스탬프 제거
  if (/^\d{10,}$/.test(t)) return '';
  if (/^\d{8}_\d{6}/.test(t)) return '';

  // 잔여 "N-" 프리픽스 한 번 더 제거 (예: "3-이 화살 못 막아")
  t = t.replace(/^\d+\s*[._\-]+\s*/, '');
  // 언더스코어·중복 공백 정리
  t = t.replace(/[_]+/g, ' ').replace(/\s+/g, ' ').trim();
  // 끝에 '복사' 제거
  t = t.replace(/\s*복사\s*$/, '').trim();

  return t;
}

function isImage(file) {
  return IMAGE_EXT.has(path.extname(file).toLowerCase());
}

function isProfile(relPath, filename) {
  if (FORCE_PROFILE_BY_PATH.has(relPath)) return true;
  return PROFILE_PATTERNS.some((re) => re.test(filename));
}

function isExcluded(filename) {
  return EXCLUDE_PATTERNS.some((re) => re.test(filename));
}

function walk(folderFsPath) {
  const result = [];
  const stack = [folderFsPath];
  while (stack.length) {
    const cur = stack.pop();
    for (const entry of fs.readdirSync(cur, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue;
      const nfcName = entry.name.normalize('NFC');
      const abs = path.join(cur, entry.name);
      if (entry.isDirectory()) { stack.push(abs); continue; }
      if (!entry.isFile()) continue;
      if (!isImage(nfcName)) continue;
      const rel = path.relative(folderFsPath, abs).split(path.sep).map((s) => s.normalize('NFC')).join('/');
      result.push({ filename: nfcName, rel, abs });
    }
  }
  return result.sort((a, b) => a.rel.localeCompare(b.rel, 'ko'));
}

const folders = fs.readdirSync(baseDir, { withFileTypes: true })
  .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
  // macOS FS는 NFD 한글 파일명을 반환 → NFC로 정규화해 코드 내 키와 일치시킴
  .map((e) => e.name.normalize('NFC'))
  .sort((a, b) => a.localeCompare(b, 'ko'));

const entries = [];
const unmappedFolders = [];
for (const folder of folders) {
  const meta = FOLDER_META[folder];
  if (!meta) { unmappedFolders.push(folder); continue; }

  const images = walk(path.join(baseDir, folder));
  let profile = null;
  const artworks = [];
  for (const img of images) {
    const relFull = `${folder}/${img.rel}`;
    if (isProfile(relFull, img.filename)) {
      if (!profile) profile = `/images_1/${folder}/${img.rel}`;
      continue;
    }
    if (isExcluded(img.filename)) continue;
    const title = cleanTitle(img.filename, { ...meta, __relPath: relFull });
    artworks.push({
      src: `/images_1/${folder}/${img.rel}`,
      title: title || '',
    });
  }

  // artworks가 비어 있으면 skip
  if (artworks.length === 0) {
    unmappedFolders.push(`${folder} (no artworks after filter)`);
    continue;
  }

  // 최대 10장
  const limited = artworks.slice(0, 10);

  entries.push({
    folder,
    artistName: meta.artistName,
    bio: meta.bio,
    groupName: meta.groupName,
    exhibitionName: meta.exhibitionName,
    isInstructor: meta.isInstructor === true,
    profile,
    images: limited.map((a) => a.src),
    pieceTitles: limited.map((a) => a.title),
  });
}

const payload = {
  generatedAt: new Date().toISOString(),
  entries,
  _debug: { unmappedFolders },
};

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(payload, null, 2), 'utf8');
console.log(`wrote ${entries.length} entries → ${path.relative(root, out)}`);
if (unmappedFolders.length) {
  console.log('unmapped / empty:', unmappedFolders);
}
