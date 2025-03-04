import puppeteer from 'puppeteer-core';
import { storage } from '../storage';
import type { TestResult } from '@shared/schema';
import { execSync } from 'child_process';
import fs from 'fs';
import { SecurityScanner } from './security-scanner';

function findChromiumPath(): string {
  // Try to find using which command first
  try {
    const chromiumPath = execSync('which chromium').toString().trim();
    if (chromiumPath) {
      console.log(`Found browser using which: ${chromiumPath}`);
      return chromiumPath;
    }
  } catch (err) {
    console.log('Could not find browser using which command');
  }

  // Common Chromium paths in Linux environments
  const paths = [
    '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome',
  ];

  for (const path of paths) {
    if (fs.existsSync(path)) {
      console.log(`Found browser at: ${path}`);
      return path;
    }
  }

  throw new Error('Could not find Chromium installation');
}

export async function runTests(testId: number, url: string) {
  console.log(`Starting tests for ${url} (Test ID: ${testId})`);
  let browser;

  try {
    await storage.updateTestStatus(testId, 'running');
    console.log('Launching browser...');

    const executablePath = findChromiumPath();
    console.log(`Using browser at path: ${executablePath}`);

    browser = await puppeteer.launch({
      executablePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ],
      headless: true
    });

    console.log('Browser launched successfully');
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    console.log('Browser page created');

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
        summary: { critical: 0, high: 0, medium: 0, low: 0 },
        ssl: { valid: false },
        headers: { missing: [], misconfigured: [] },
      },
    };

    // Measure navigation time
    console.log('Navigating to page...');
    const start = Date.now();
    await page.goto(url, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
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
    const timing = await page.evaluate(() => ({
      loadTime: performance.now(),
      responseTime: performance.timing ? 
        performance.timing.responseEnd - performance.timing.requestStart : 
        0
    }));

    results.performance = {
      loadTime: Math.round(timing.loadTime),
      responseTime: timing.responseTime,
    };
    console.log('Performance metrics:', results.performance);

    // Run security scans
    console.log('Running comprehensive security scans...');
    const securityScanner = new SecurityScanner(page, url);
    const securityResults = await securityScanner.runAllScans();
    results.security = securityResults;

    console.log('Security scan complete.');
    console.log(`Found ${results.security.vulnerabilities.length} security issues:`);
    console.log('Critical:', results.security.summary.critical);
    console.log('High:', results.security.summary.high);
    console.log('Medium:', results.security.summary.medium);
    console.log('Low:', results.security.summary.low);

    // Update test results
    console.log('Updating test results...');
    await storage.updateTestResults(testId, results);
    console.log('Test completed successfully');

  } catch (err) {
    console.error('Test failed:', err);
    await storage.updateTestStatus(testId, 'failed');
  } finally {
    if (browser) {
      try {
        await browser.close();
        console.log('Browser closed successfully');
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }
  }
}