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
    const courseLinks = await page.locator('a[href^="/courses/"]').count();
    console.log(`   Course cards: ${courseLinks}`);
    await shot(page, '1-courses');

    // 2. Sign in
    console.log('\n[2] Auth page');
    await page.goto(`${BASE}/auth`, { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(1000);
    await page.locator('input[type="email"]').fill('test123@test.com');
    await page.locator('input[type="password"]').fill('Test@12345');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(3500);
    const urlAfterAuth = page.url();
    console.log(`   URL after submit: ${urlAfterAuth}`);
    await shot(page, '2-auth');

    // 3. Course detail - go to first course
    console.log('\n[3] Course detail');
    await page.goto(`${BASE}/courses`, { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(2000);
    const allCourseLinks = await page.locator('a[href^="/courses/"]').all();
    let courseHref = null;
    for (const link of allCourseLinks) {
      const href = await link.getAttribute('href');
      if (href && href !== '/courses' && href !== '/courses/') {
        courseHref = href;
        break;
      }
    }
    console.log(`   First course href: ${courseHref}`);

    if (courseHref) {
      await page.goto(`${BASE}${courseHref}`, { waitUntil: 'networkidle', timeout: 12000 });
      await page.waitForTimeout(2500);
      const h1 = await page.locator('h1').first().textContent().catch(() => '(none)');
      console.log(`   Course title: "${h1}"`);
      await shot(page, '3-course-detail');

      const enrollBtns = await page.locator('button').filter({ hasText: /enroll/i }).count();
      let learnLinks = await page.locator('a[href*="/learn/"]').count();
      console.log(`   Enroll buttons: ${enrollBtns}, Learn links: ${learnLinks}`);

      // 4. Enroll
      if (enrollBtns > 0) {
        console.log('\n[4] Enrolling');
        await page.locator('button').filter({ hasText: /enroll/i }).first().click();
        await page.waitForTimeout(3000);
        await shot(page, '4-enrolled');
        learnLinks = await page.locator('a[href*="/learn/"]').count();
        console.log(`   Learn links after enroll: ${learnLinks}`);
      }

      // 5. Click lesson
      console.log('\n[5] Lesson page');
      const links = await page.locator('a[href*="/learn/"]').all();
      if (links.length > 0) {
        const lessonHref = await links[0].getAttribute('href');
        console.log(`   Navigating to: ${lessonHref}`);
        await page.goto(`${BASE}${lessonHref}`, { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(3500);
        await shot(page, '5-lesson');

        const url = page.url();
        const lessonH1 = await page.locator('h1').first().textContent().catch(() => '');
        const hasNotes = await page.locator('text=Lesson Notes').count();
        const skeletons = await page.locator('[class*="animate-pulse"]').count();
        const hasSidebar = await page.locator('aside').count();
        const markDone = await page.locator('button').filter({ hasText: /mark.*complete|complete/i }).count();

        console.log(`   Final URL: ${url}`);
        console.log(`   H1: "${lessonH1}"`);
        console.log(`   Lesson Notes section: ${hasNotes}`);
        console.log(`   Loading skeletons: ${skeletons}`);
        console.log(`   Sidebar: ${hasSidebar}`);
        console.log(`   Mark Complete btn: ${markDone}`);

        if (lessonH1.trim() && skeletons === 0) {
          console.log('\n==> PASS: Lesson content loaded correctly');
        } else if (skeletons > 0) {
          console.log('\n==> FAIL: Still showing loading skeletons (lesson did not load)');
        } else {
          console.log('\n==> UNKNOWN: H1 empty but no skeletons');
        }
      } else {
        // Maybe not enrolled — try admin account
        console.log('   No learn links. Trying admin sign in...');
        await page.goto(`${BASE}/auth`, { waitUntil: 'networkidle', timeout: 8000 });
        await page.locator('input[type="email"]').fill('hamisi.911.ltd@gmail.com');
        await page.locator('input[type="password"]').fill('Admin@123');
        await page.locator('button[type="submit"]').first().click();
        await page.waitForTimeout(3000);
        console.log(`   Auth URL: ${page.url()}`);
        await page.goto(`${BASE}${courseHref}`, { waitUntil: 'networkidle', timeout: 10000 });
        await page.waitForTimeout(2000);
        const linksAdmin = await page.locator('a[href*="/learn/"]').count();
        console.log(`   Learn links as admin: ${linksAdmin}`);
        await shot(page, '5-admin-course');
      }
    }

  } finally {
    if (jsErrors.length) {
      console.log(`\nJS errors (${jsErrors.length}):`);
      jsErrors.slice(0, 5).forEach(e => console.log('  ', e.slice(0, 150)));
    } else {
      console.log('\nNo JS errors detected');
    }
    await browser.close();
  }
}

run().catch(e => { console.error('\nFATAL:', e.message); process.exit(1); });
