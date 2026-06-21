const { chromium } = require('C:/Users/john/AppData/Roaming/npm/node_modules/playwright');

const BASE = 'https://vlapp.glotech.workers.dev';
const SHOTS = 'C:/Users/john/AppData/Local/Temp';

async function shot(page, name) {
  const p = `${SHOTS}/vl-${name}.png`;
  await page.screenshot({ path: p });
  console.log(`  screenshot: ${p}`);
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  const jsErrors = [];
  page.on('console', m => { if (m.type() === 'error') jsErrors.push(m.text()); });
  page.on('pageerror', e => jsErrors.push(e.message));

  try {
    // 1. Courses page
    console.log('\n[1] Courses page');
    await page.goto(`${BASE}/courses`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);
    const courseLinks = await page.locator('a[href*="/courses/"]').count();
    console.log(`   Course cards: ${courseLinks}`);
    await shot(page, '1-courses');

    // 2. Sign in
    console.log('\n[2] Sign in');
    await page.goto(`${BASE}/auth`, { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(1000);
    await page.locator('input[type="email"]').fill('test@example.com');
    await page.locator('input[type="password"]').fill('Password@123');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(3000);
    const urlAfterAuth = page.url();
    console.log(`   URL after auth: ${urlAfterAuth}`);
    await shot(page, '2-auth');

    // 3. Navigate to a course detail page directly
    console.log('\n[3] Course detail');
    await page.goto(`${BASE}/courses`, { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(2000);
    const firstCourseLink = page.locator('a[href^="/courses/"]').first();
    const courseHref = await firstCourseLink.getAttribute('href').catch(() => null);
    console.log(`   First course href: ${courseHref}`);

    if (courseHref) {
      await page.goto(`${BASE}${courseHref}`, { waitUntil: 'networkidle', timeout: 10000 });
      await page.waitForTimeout(2500);
      const h1 = await page.locator('h1').first().textContent().catch(() => '(none)');
      console.log(`   Course title: "${h1}"`);
      await shot(page, '3-course-detail');

      const enrollBtns = await page.locator('button').filter({ hasText: /enroll/i }).count();
      const learnLinks = await page.locator('a[href*="/learn/"]').count();
      console.log(`   Enroll buttons: ${enrollBtns}, Learn links: ${learnLinks}`);

      // 4. Try enrolling if button exists
      if (enrollBtns > 0) {
        console.log('\n[4] Clicking enroll');
        await page.locator('button').filter({ hasText: /enroll/i }).first().click();
        await page.waitForTimeout(3000);
        await shot(page, '4-post-enroll');
        const learnLinksAfter = await page.locator('a[href*="/learn/"]').count();
        console.log(`   Learn links after enroll: ${learnLinksAfter}`);
      }

      // 5. Click a lesson — go directly via URL if link exists
      console.log('\n[5] Lesson navigation');
      const learnLink = page.locator('a[href*="/learn/"]').first();
      const learnCount = await learnLink.count();
      console.log(`   Learn links available: ${learnCount}`);

      if (learnCount > 0) {
        const lessonUrl = await learnLink.getAttribute('href');
        console.log(`   Navigating to lesson: ${lessonUrl}`);
        await page.goto(`${BASE}${lessonUrl}`, { waitUntil: 'networkidle', timeout: 12000 });
        await page.waitForTimeout(3000);
        await shot(page, '5-lesson');

        const lessonH1 = await page.locator('h1').first().textContent().catch(() => 'NONE');
        const url = page.url();
        const hasContent = await page.locator('text=Lesson Notes').count();
        const hasSkeleton = await page.locator('[class*="skeleton"], [class*="animate-pulse"]').count();
        const hasSidebar = await page.locator('aside').count();

        console.log(`   Current URL: ${url}`);
        console.log(`   H1 text: "${lessonH1}"`);
        console.log(`   "Lesson Notes" section: ${hasContent > 0}`);
        console.log(`   Loading skeletons still showing: ${hasSkeleton}`);
        console.log(`   Sidebar present: ${hasSidebar > 0}`);

        if (lessonH1.trim() && !hasSkeleton) {
          console.log('   RESULT: Lesson loaded successfully');
        } else if (hasSkeleton) {
          console.log('   RESULT: FAIL - stuck on skeleton/loading');
        } else {
          console.log('   RESULT: Unknown state');
        }
      } else {
        console.log('   No lesson links — constructing learn URL from course slug');
        // Try to build learn URL from course slug
        const slug = courseHref.replace('/courses/', '');
        console.log(`   Course slug: ${slug}`);
      }
    }

  } finally {
    if (jsErrors.length) {
      console.log(`\nJS errors (${jsErrors.length}):`);
      jsErrors.slice(0, 5).forEach(e => console.log('  ', e.slice(0, 120)));
    } else {
      console.log('\nNo JS console errors');
    }
    await browser.close();
    try { require('fs').unlinkSync(__filename); } catch(_) {}
  }
}

run().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
