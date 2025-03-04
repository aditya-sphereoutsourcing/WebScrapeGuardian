import puppeteer from 'puppeteer';
import { storage } from '../storage';
import type { TestResult } from '@shared/schema';

export async function runTests(testId: number, url: string) {
  console.log(`Starting tests for ${url} (Test ID: ${testId})`);
  try {
    await storage.updateTestStatus(testId, 'running');
    console.log('Launching browser...');

    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    console.log('Browser launched successfully');

    // Initialize results object
    const results: TestResult = {
      functional: {
        navigationTime: 0,
        brokenLinks: [],
      },
      performance: {
        loadTime: 0,
        responseTime: 0,
      },
      security: {
        vulnerabilities: [],
      },
    };

    // Measure navigation time
    console.log('Navigating to page...');
    const start = Date.now();
    await page.goto(url, { waitUntil: 'networkidle0' });
    results.functional.navigationTime = Date.now() - start;
    console.log(`Navigation completed in ${results.functional.navigationTime}ms`);

    // Check for broken links
    console.log('Checking for broken links...');
    const links = await page.evaluate(() => 
      Array.from(document.querySelectorAll('a')).map(a => a.href)
    );
    console.log(`Found ${links.length} links to check`);

    for (const link of links) {
      try {
        const res = await fetch(link);
        if (!res.ok) {
          console.log(`Found broken link: ${link}`);
          results.functional.brokenLinks.push(link);
        }
      } catch (err) {
        console.log(`Error checking link ${link}:`, err);
        results.functional.brokenLinks.push(link);
      }
    }

    // Performance metrics
    console.log('Collecting performance metrics...');
    const perfMetrics = await page.evaluate(() => ({
      loadTime: window.performance.timing.loadEventEnd - window.performance.timing.navigationStart,
      responseTime: window.performance.timing.responseEnd - window.performance.timing.requestStart,
    }));

    results.performance = {
      loadTime: perfMetrics.loadTime,
      responseTime: perfMetrics.responseTime,
    };
    console.log('Performance metrics:', results.performance);

    // Security checks
    console.log('Running security checks...');
    const headers = await page.evaluate(() => 
      fetch(window.location.href).then(r => 
        Object.fromEntries(Array.from(r.headers.entries()))
      )
    );

    if (!headers['x-frame-options']) {
      results.security.vulnerabilities.push({
        type: 'Missing Headers',
        description: 'X-Frame-Options header is missing',
        severity: 'medium',
      });
    }

    if (!headers['content-security-policy']) {
      results.security.vulnerabilities.push({
        type: 'Missing Headers',
        description: 'Content-Security-Policy header is missing',
        severity: 'high',
      });
    }

    console.log(`Found ${results.security.vulnerabilities.length} security vulnerabilities`);

    await browser.close();
    console.log('Browser closed, updating test results...');
    await storage.updateTestResults(testId, results);
    console.log('Test completed successfully');
  } catch (err) {
    console.error('Test failed:', err);
    await storage.updateTestStatus(testId, 'failed');
  }
}