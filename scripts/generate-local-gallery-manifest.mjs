#!/usr/bin/env node
/**
 * public/images 내 이미지 목록 → src/app/data/localGalleryManifest.json
 * pnpm exec node scripts/generate-local-gallery-manifest.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const imgDir = path.join(root, 'public', 'images');
const out = path.join(root, 'src', 'app', 'data', 'localGalleryManifest.json');

const extOk = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const files = fs
  .readdirSync(imgDir)
  .filter((f) => {
    const full = path.join(imgDir, f);
    if (!fs.statSync(full).isFile()) return false;
    const ext = path.extname(f).toLowerCase();
    if (!extOk.has(ext)) return false;
    const trimmed = f.trim();
    if (!trimmed || trimmed.length < 2) return false;
    return true;
  })
  .sort((a, b) => a.localeCompare(b, 'ko'));

const payload = { generatedAt: new Date().toISOString(), paths: files.map((f) => `/images/${f}`) };

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(payload, null, 0), 'utf8');
console.log(`wrote ${files.length} paths → ${path.relative(root, out)}`);
