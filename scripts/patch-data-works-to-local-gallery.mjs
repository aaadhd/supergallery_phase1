import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(__dirname, '..', 'src', 'app', 'data.ts');
let s = fs.readFileSync(file, 'utf8');

const importBlock = `import localGalleryManifest from './data/localGalleryManifest.json';
import { buildLocalPublicWorks } from './data/localPublicGalleryWorks';
`;

if (!s.includes('localGalleryManifest')) {
  const nl = s.indexOf('\n');
  s = s.slice(0, nl + 1) + importBlock + s.slice(nl + 1);
}

const start = s.indexOf('// 작품 더미 데이터');
const end = s.indexOf('\n\n// Unsplash 검색 쿼리 매핑');
if (start === -1 || end === -1) throw new Error('markers not found — data.ts already patched?');

const replacement = `// 둘러보기 시드: public/images (localGalleryManifest.json, 갱신: generate-local-gallery-manifest.mjs)
export const works: Work[] = buildLocalPublicWorks(localGalleryManifest.paths, artists);
`;

s = s.slice(0, start) + replacement + s.slice(end);
fs.writeFileSync(file, s, 'utf8');
console.log('patched', path.relative(path.join(__dirname, '..'), file));
