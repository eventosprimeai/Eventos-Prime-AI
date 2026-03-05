const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    // Assuming already logged in or session persists, otherwise just capture homepage
    // We'll capture the login page anyway or whatever is rendered.

    try {
        console.log("Navigating to http://localhost:3001/ ...");
        await page.goto('http://localhost:3001/', { waitUntil: 'networkidle', timeout: 30000 });

        // Check if we hit the login page
        const url = page.url();
        if (url.includes('login')) {
            console.log("Redirected to login. Logging in...");
            await page.fill('input[type="email"]', 'ventas@eventosprimeai.com');
            await page.fill('input[type="password"]', 'Gabriel230386@');
            await page.click('button[type="submit"]');
            await page.waitForTimeout(3000); // Wait for login
        }

        // Evaluate zoom if needed
        await page.evaluate(() => {
            document.body.style.zoom = "90%";
        });

        await page.waitForTimeout(2000); // Give it a sec to render charts

        const screenshotPath = 'C:\\Users\\hp\\.gemini\\antigravity\\brain\\986f84eb-1773-4890-ae7c-0f2610f90e11\\iphone_black_preview.png';
        await page.screenshot({ path: screenshotPath, fullPage: true });

        console.log("Screenshot saved at", screenshotPath);
    } catch (e) {
        console.error(e);
    }

    await browser.close();
})();
