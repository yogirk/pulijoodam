/**
 * Capture Temple Stone screenshots for the README.
 *
 * Usage:  npm run dev   (in another terminal)
 *         node scripts/capture-screenshots.mjs
 *
 * Output: docs/screenshots/*.png
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const outDir = resolve(repoRoot, 'docs/screenshots');
const URL = process.env.PULIJOODAM_URL || 'http://localhost:5173/pulijoodam/';

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({
  deviceScaleFactor: 2,
  reducedMotion: 'reduce',
});

// Suppress the first-launch tutorial modal AND clear any leftover saved-game
// state so setup-screen captures are clean (no stale resume banner).
// Settings (theme/lang) are set explicitly per-capture via toggle clicks.
await ctx.addInitScript(() => {
  try {
    localStorage.clear();
    localStorage.setItem('pulijoodam_tutorial_seen', 'true');
  } catch {}
});

async function settle(page) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(300);
}

async function setLang(page, lang) {
  await page.getByTestId(`lang-${lang}`).click();
  await page.waitForTimeout(120);
}

async function setTheme(page, theme) {
  const html = page.locator('html');
  const current = await html.getAttribute('data-theme');
  if (current !== theme) {
    await page.getByTestId('theme-toggle').click();
    await page.waitForTimeout(180);
  }
}

async function capture({ name, width, height, lang = 'en', theme = 'light', after }) {
  const page = await ctx.newPage();
  await page.setViewportSize({ width, height });
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await settle(page);
  await setLang(page, lang);
  await setTheme(page, theme);
  await settle(page);
  if (after) await after(page);
  const path = resolve(outDir, `${name}.png`);
  await page.screenshot({ path, fullPage: false });
  console.log('•', path);
  await page.close();
}

await capture({ name: 'setup-light-en', width: 1440, height: 900 });
await capture({ name: 'setup-dark-en',  width: 1440, height: 900, theme: 'dark' });
await capture({ name: 'setup-light-te', width: 1440, height: 900, lang: 'te' });
await capture({ name: 'setup-mobile-en', width: 390, height: 844 });
await capture({
  name: 'game-light-en',
  width: 1440,
  height: 900,
  async after(page) {
    await page.getByTestId('begin-btn').click();
    await page.waitForTimeout(600);
    const nodeIds = ['board-node-12', 'board-node-13', 'board-node-7'];
    for (const id of nodeIds) {
      const el = page.getByTestId(id);
      if (await el.count()) {
        try {
          await el.first().click({ timeout: 800 });
          await page.waitForTimeout(350);
        } catch {
          /* node not yet legal — skip */
        }
      }
    }
    await page.waitForTimeout(300);
  },
});

await browser.close();
console.log('done — wrote', outDir);
