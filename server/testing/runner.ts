import puppeteer from 'puppeteer';
import { storage } from '../storage';
import type { TestResult } from '@shared/schema';

export async function runTests(testId: number, url: string) {
  try {
    await storage.updateTestStatus(testId, 'running');
    
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Collect metrics
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
    const start = Date.now();
    await page.goto(url, { waitUntil: 'networkidle0' });
    results.functional.navigationTime = Date.now() - start;
    
    // Check for broken links
    const links = await page.evaluate(() => 
      Array.from(document.querySelectorAll('a')).map(a => a.href)
    );
    
    for (const link of links) {
      try {
        const res = await fetch(link);
        if (!res.ok) {
          results.functional.brokenLinks.push(link);
        }
      } catch (err) {
        results.functional.brokenLinks.push(link);
      }
    }
    
    // Performance metrics
    const perfMetrics = await page.evaluate(() => ({
      loadTime: window.performance.timing.loadEventEnd - window.performance.timing.navigationStart,
      responseTime: window.performance.timing.responseEnd - window.performance.timing.requestStart,
    }));
    
    results.performance = {
      loadTime: perfMetrics.loadTime,
      responseTime: perfMetrics.responseTime,
    };
    
    // Basic security checks
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
    
    await browser.close();
    await storage.updateTestResults(testId, results);
  } catch (err) {
    console.error('Test failed:', err);
    await storage.updateTestStatus(testId, 'failed');
  }
}
