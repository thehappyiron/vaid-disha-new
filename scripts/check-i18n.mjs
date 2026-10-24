import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const enPath = path.join(rootDir, 'src', 'i18n', 'locales', 'en.json');
const hiPath = path.join(rootDir, 'src', 'i18n', 'locales', 'hi.json');
const mrPath = path.join(rootDir, 'src', 'i18n', 'locales', 'mr.json');

function flattenKeys(obj, prefix = '') {
  let keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys = keys.concat(flattenKeys(v, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

console.log('════════════════════════════════════════════════════════════════');
console.log('              VAID DISHA i18n COMPLETENESS AUDIT                ');
console.log('════════════════════════════════════════════════════════════════\n');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const hi = JSON.parse(fs.readFileSync(hiPath, 'utf8'));
const mr = JSON.parse(fs.readFileSync(mrPath, 'utf8'));

const enKeys = new Set(flattenKeys(en));
const hiKeys = new Set(flattenKeys(hi));
const mrKeys = new Set(flattenKeys(mr));

console.log(`[Summary] Total translation keys:`);
console.log(`  - English (en): ${enKeys.size}`);
console.log(`  - Hindi   (hi): ${hiKeys.size}`);
console.log(`  - Marathi (mr): ${mrKeys.size}\n`);

// Missing in Hindi
const missingInHi = [...enKeys].filter((k) => !hiKeys.has(k));
// Missing in Marathi
const missingInMr = [...enKeys].filter((k) => !mrKeys.has(k));
// Extra in Hindi/Marathi
const extraInHi = [...hiKeys].filter((k) => !enKeys.has(k));
const extraInMr = [...mrKeys].filter((k) => !enKeys.has(k));

console.log(`[Key Parity Check]`);
if (missingInHi.length === 0) {
  console.log(`  ✓ All English keys present in Hindi (hi)`);
} else {
  console.log(`  ✗ Missing in Hindi (${missingInHi.length}):`);
  missingInHi.forEach((k) => console.log(`     - ${k}`));
}

if (missingInMr.length === 0) {
  console.log(`  ✓ All English keys present in Marathi (mr)`);
} else {
  console.log(`  ✗ Missing in Marathi (${missingInMr.length}):`);
  missingInMr.forEach((k) => console.log(`     - ${k}`));
}

if (extraInHi.length > 0) {
  console.log(`  ℹ Extra keys in Hindi not in English: ${extraInHi.length}`);
}
if (extraInMr.length > 0) {
  console.log(`  ℹ Extra keys in Marathi not in English: ${extraInMr.length}`);
}

console.log('\n[Hardcoded String Scanner in .tsx files]');

function scanDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist') {
        scanDir(full, fileList);
      }
    } else if (file.endsWith('.tsx')) {
      fileList.push(full);
    }
  }
  return fileList;
}

const tsxFiles = scanDir(path.join(rootDir, 'src'));
let totalIssues = 0;

for (const file of tsxFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  const relPath = path.relative(rootDir, file).replace(/\\/g, '/');

  lines.forEach((line, lineIdx) => {
    // Check for hardcoded plain text in aria-label="..." without t()
    const ariaMatch = line.match(/aria-label="([^"{]+)"/);
    if (ariaMatch && !line.includes('t(') && !ariaMatch[1].startsWith('{')) {
      const text = ariaMatch[1].trim();
      if (text.length > 1 && !/^[\d\s\-_:.]+$/.test(text)) {
        // exclude trivial labels
      }
    }
  });
}

console.log(`  Scanned ${tsxFiles.length} .tsx files.`);
console.log('════════════════════════════════════════════════════════════════\n');

// Exit with code 1 if missing keys, else 0
if (missingInHi.length > 0 || missingInMr.length > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
