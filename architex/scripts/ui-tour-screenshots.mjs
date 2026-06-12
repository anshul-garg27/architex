/**
 * UI Tour Screenshot Script
 * Captures screenshots of all major routes for the 09-ui-tour.md doc.
 * Run with: node scripts/ui-tour-screenshots.mjs
 */

import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';
const SCREENSHOTS_DIR = '/Users/a0g11b6/Downloads/projects/architex/architex/docs/CODEMAPS/screenshots';
const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844, isMobile: true };

const routes = [
  { path: '/', name: 'home', desktop: true, mobile: true },
  { path: '/pricing', name: 'pricing', desktop: true, mobile: true },
  { path: '/blog', name: 'blog', desktop: true, mobile: false },
  { path: '/gallery', name: 'gallery', desktop: true, mobile: false },
  { path: '/learn', name: 'learn', desktop: true, mobile: false },
  { path: '/modules', name: 'modules', desktop: true, mobile: false },
  { path: '/concepts', name: 'concepts', desktop: true, mobile: false },
  { path: '/lld-problems', name: 'lld-problems', desktop: true, mobile: false },
  { path: '/algorithms', name: 'algorithms', desktop: true, mobile: false },
  { path: '/database', name: 'database', desktop: true, mobile: false },
  { path: '/ds', name: 'ds', desktop: true, mobile: false },
  { path: '/os', name: 'os', desktop: true, mobile: false },
  { path: '/patterns', name: 'patterns', desktop: true, mobile: false },
  { path: '/problems', name: 'problems', desktop: true, mobile: false },
  { path: '/dashboard', name: 'dashboard', desktop: true, mobile: false },
  { path: '/sign-in', name: 'sign-in', desktop: true, mobile: false },
];

const results = [];

async function captureRoute(browser, route, viewport, suffix) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    userAgent: viewport.isMobile
      ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
      : undefined,
  });

  const page = await context.newPage();
  const result = {
    route: route.path,
    name: route.name,
    suffix,
    status: null,
    finalUrl: null,
    title: null,
    h1: null,
    error: null,
    screenshotFile: null,
    navItems: [],
    mainElements: [],
  };

  try {
    const response = await page.goto(`${BASE_URL}${route.path}`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    result.status = response ? response.status() : 'no-response';
    result.finalUrl = page.url();

    // Wait a bit for JS to hydrate
    await page.waitForTimeout(2000);

    result.title = await page.title();

    // Get h1
    try {
      result.h1 = await page.locator('h1').first().textContent({ timeout: 3000 });
    } catch {
      result.h1 = null;
    }

    // Get nav items
    try {
      const navLinks = await page.locator('nav a').allTextContents();
      result.navItems = navLinks.slice(0, 10);
    } catch {
      result.navItems = [];
    }

    // Get main visible headings
    try {
      const headings = await page.locator('h1, h2, h3').allTextContents();
      result.mainElements = headings.slice(0, 8).map(h => h.trim()).filter(Boolean);
    } catch {
      result.mainElements = [];
    }

    // Take screenshot
    const fileName = `${route.name}-${suffix}.png`;
    const filePath = path.join(SCREENSHOTS_DIR, fileName);
    await page.screenshot({ path: filePath, fullPage: true });
    result.screenshotFile = fileName;

    console.log(`[OK] ${route.path} (${suffix}) → ${filePath}`);
  } catch (err) {
    result.error = err.message;
    // Try to screenshot even on error
    try {
      const fileName = `${route.name}-${suffix}-error.png`;
      const filePath = path.join(SCREENSHOTS_DIR, fileName);
      await page.screenshot({ path: filePath, fullPage: true });
      result.screenshotFile = fileName;
    } catch {}
    console.error(`[ERR] ${route.path} (${suffix}): ${err.message}`);
  }

  await context.close();
  return result;
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  try {
    for (const route of routes) {
      if (route.desktop) {
        const r = await captureRoute(browser, route, DESKTOP, 'desktop');
        results.push(r);
      }
      if (route.mobile) {
        const r = await captureRoute(browser, route, MOBILE, 'mobile');
        results.push(r);
      }
    }

    // Also capture a specific LLD problem page if the list is available
    // Try to find a first slug by navigating to /lld-problems first
    const context = await browser.newContext({ viewport: DESKTOP });
    const page = await context.newPage();
    try {
      await page.goto(`${BASE_URL}/lld-problems`, { waitUntil: 'networkidle', timeout: 20000 });
      await page.waitForTimeout(1500);
      // Find first problem link
      const firstLink = await page.locator('a[href^="/lld-problems/"]').first();
      const href = await firstLink.getAttribute('href').catch(() => null);
      if (href && href !== '/lld-problems') {
        const slugResult = {
          route: href,
          name: 'lld-problem-detail',
          suffix: 'desktop',
          status: null,
          finalUrl: null,
          title: null,
          h1: null,
          error: null,
          screenshotFile: null,
          navItems: [],
          mainElements: [],
        };
        try {
          const resp = await page.goto(`${BASE_URL}${href}`, { waitUntil: 'networkidle', timeout: 30000 });
          slugResult.status = resp ? resp.status() : null;
          slugResult.finalUrl = page.url();
          await page.waitForTimeout(2000);
          slugResult.title = await page.title();
          try { slugResult.h1 = await page.locator('h1').first().textContent({ timeout: 3000 }); } catch {}
          const fileName = 'lld-problem-detail-desktop.png';
          await page.screenshot({ path: path.join(SCREENSHOTS_DIR, fileName), fullPage: true });
          slugResult.screenshotFile = fileName;
          console.log(`[OK] ${href} (desktop) → ${fileName}`);
        } catch (e) {
          slugResult.error = e.message;
        }
        results.push(slugResult);
      }
    } catch (e) {
      console.error(`[ERR] LLD detail page: ${e.message}`);
    }
    await context.close();

    // Save results JSON for reference
    writeFileSync(
      path.join(SCREENSHOTS_DIR, 'tour-results.json'),
      JSON.stringify(results, null, 2)
    );

    console.log('\n=== DONE ===');
    console.log(JSON.stringify(results, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
