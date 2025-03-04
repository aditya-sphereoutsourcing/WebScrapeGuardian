import PDFDocument from 'pdfkit';
import type { Test, TestResult } from '@shared/schema';

export async function generatePDF(test: Test): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.fontSize(25).text('Website Test Report', { align: 'center' });
    doc.moveDown();

    // Test Info
    doc.fontSize(14).text('Test Details');
    doc.fontSize(12)
      .text(`URL: ${test.url}`)
      .text(`Date: ${test.createdAt?.toLocaleString() || 'N/A'}`)
      .text(`Status: ${test.status}`);
    doc.moveDown();

    if (test.results) {
      const results = test.results as TestResult;

      // Functional Tests
      doc.fontSize(14).text('Functional Test Results');
      doc.fontSize(12)
        .text(`Navigation Time: ${results.functional.navigationTime}ms`)
        .text(`Broken Links: ${results.functional.brokenLinks.length}`);

      if (results.functional.brokenLinks.length > 0) {
        doc.moveDown()
          .text('Broken Links:');
        results.functional.brokenLinks.forEach(link => {
          doc.text(`• ${link}`);
        });
      }
      doc.moveDown();

      // Performance Tests
      doc.fontSize(14).text('Performance Test Results');
      doc.fontSize(12)
        .text(`Load Time: ${results.performance.loadTime}ms`)
        .text(`Response Time: ${results.performance.responseTime}ms`);
      doc.moveDown();

      // Security Tests
      doc.fontSize(14).text('Security Test Results');
      if (results.security.vulnerabilities.length === 0) {
        doc.fontSize(12).text('No vulnerabilities found');
      } else {
        results.security.vulnerabilities.forEach(vuln => {
          doc.fontSize(12)
            .text(`Type: ${vuln.type}`)
            .text(`Description: ${vuln.description}`)
            .text(`Severity: ${vuln.severity}`)
            .moveDown();
        });
      }
    }

    doc.end();
  });
}