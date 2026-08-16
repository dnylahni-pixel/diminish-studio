#!/usr/bin/env node
/**
 * Cline Persian/Bidi text fix
 *
 * > مشکل: فایل CSS باندلشده Cline در لایه پایه `p { unicode-bidi: isolate }` دارد
 * > که چیدمان متنهای ترکیبی فارسی/انگلیسی را در پیامهای چت بههم میریزد.
 *
 * این اسکریپت بلوک CSS اصلاحی را (idempotent) به انتهای
 * `webview-ui/build/assets/index.css` اکستنشن Cline اضافه میکند.
 * بعد از هر آپدیت Cline دوباره اجرا کنید (فایلهای باندل بازنویسی میشوند).
 *
 * اجرا:  node scripts/cline-fa-fix.mjs
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const isWin = process.platform === "win32";

// مسیرهای احتمالی نصب اکستنشن Cline (پیشوندهای مختلف)
const candidateRoots = [];
if (isWin) {
  candidateRoots.push(join(process.env.USERPROFILE || "", ".vscode", "extensions"));
  candidateRoots.push(join(process.env.USERPROFILE || "", ".vscode-insiders", "extensions"));
  candidateRoots.push(join(process.env.USERPROFILE || "", ".cursor", "extensions"));
} else {
  candidateRoots.push(join(homedir(), ".vscode", "extensions"));
  candidateRoots.push(join(homedir(), ".vscode-oss", "extensions"));
  candidateRoots.push(join(homedir(), ".cursor", "extensions"));
  candidateRoots.push(join(homedir(), ".vscode-server", "extensions"));
}

// برندهای مختلف فروشگاه اکستنشن Cline
const brandPrefixes = [
  "saoudrizwan.claude-dev", // Cline در Marketplace رسمی
  "cline.cline",            // Cline (برند جدید)
  "rooveterinaryinc.roo-cline", // Roo Cline (فورک)
];

const MARKER = "Persian/Bidi text fix";
const CSS_FIX = `/* ---- ${MARKER} (applied by scripts/cline-fa-fix.mjs) ---- */
.inline-markdown-block p,
.inline-markdown-block li,
.inline-markdown-block h1,
.inline-markdown-block h2,
.inline-markdown-block h3,
.inline-markdown-block h4,
.inline-markdown-block h5,
.inline-markdown-block h6,
.inline-markdown-block td,
.inline-markdown-block th,
.inline-markdown-block blockquote {
  unicode-bidi: plaintext !important;
  text-align: start;
}
`;

function findCssFiles() {
  const found = [];
  for (const root of candidateRoots) {
    if (!existsSync(root)) continue;
    let entries;
    try {
      entries = require("node:fs").readdirSync(root, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const brandHit = brandPrefixes.some((p) => entry.name.startsWith(p));
      if (!brandHit) continue;
      const candidate = join(root, entry.name, "webview-ui", "build", "assets", "index.css");
      if (existsSync(candidate)) found.push(candidate);
    }
  }
  return found;
}

function applyFix(cssPath) {
  let css = readFileSync(cssPath, "utf8");
  if (css.includes(MARKER)) {
    console.log(`✔ از قبل اعمال شده: ${cssPath}`);
    return true;
  }
  writeFileSync(cssPath, css + "\n" + CSS_FIX, "utf8");
  console.log(`✔ اصلاح اعمال شد: ${cssPath}`);
  return true;
}

const files = findCssFiles();
if (files.length === 0) {
  console.error("✖ هیچ فایل index.css از اکستنشن Cline پیدا نشد.");
  console.error("  مسیرهای جستجو:");
  for (const r of candidateRoots) console.error("   - " + r);
  console.error("  اگر اکستنشن در جای دیگر نصب است، مسیر را در ابتدای اسکریپت تنظیم کنید.");
  process.exit(1);
}

let ok = 0;
for (const f of files) {
  if (applyFix(f)) ok++;
}
console.log(`\nتمام شد: ${ok}/${files.length} فایل اصلاح شد.`);
console.log("برای اعمال، VS Code را با  Developer: Reload Window  بارگذاری مجدد کنید.");