import type { SecurityVulnerability } from '@shared/schema';
import { Page } from 'puppeteer-core';

export class SecurityScanner {
  private vulnerabilities: SecurityVulnerability[] = [];
  private missingHeaders: string[] = [];
  private misconfiguredHeaders: string[] = [];

  constructor(private page: Page, private url: string) {}

  private addVulnerability(vulnerability: SecurityVulnerability) {
    this.vulnerabilities.push(vulnerability);
    console.log(`Found ${vulnerability.severity} security issue:`, vulnerability.type);
  }

  async scanHeaders(): Promise<void> {
    console.log('Scanning security headers...');
    const headers = await this.page.evaluate(() => 
      fetch(window.location.href).then(r => 
        Object.fromEntries(Array.from(r.headers.entries()))
      )
    );

    // Check for essential security headers
    const requiredHeaders = {
      'x-frame-options': {
        severity: 'medium' as const,
        description: 'Protection against clickjacking attacks',
      },
      'x-content-type-options': {
        severity: 'medium' as const,
        description: 'Prevention of MIME-type sniffing',
      },
      'strict-transport-security': {
        severity: 'high' as const,
        description: 'Enforces HTTPS connections',
      },
      'content-security-policy': {
        severity: 'high' as const,
        description: 'Controls resource loading to prevent XSS',
      },
      'x-xss-protection': {
        severity: 'medium' as const,
        description: 'Basic XSS prevention',
      },
    };

    for (const [header, info] of Object.entries(requiredHeaders)) {
      if (!headers[header]) {
        this.missingHeaders.push(header);
        this.addVulnerability({
          type: 'Missing Security Header',
          description: `${header} header is missing. This header provides ${info.description}.`,
          severity: info.severity,
          recommendation: `Add the ${header} header to your server responses.`
        });
      }
    }
  }

  async scanXSS(): Promise<void> {
    console.log('Scanning for XSS vulnerabilities...');
    const xssPayloads = [
      '<script>alert(1)</script>',
      '"><script>alert(1)</script>',
      '\'><script>alert(1)</script>',
      '<img src=x onerror=alert(1)>',
    ];

    // Check form inputs for XSS
    const inputs = await this.page.$$('input');
    for (const input of inputs) {
      for (const payload of xssPayloads) {
        try {
          await input.type(payload);
          const reflected = await this.page.evaluate(() => 
            document.body.innerHTML.includes(payload)
          );
          if (reflected) {
            this.addVulnerability({
              type: 'Potential XSS Vulnerability',
              description: 'User input is reflected without proper sanitization',
              severity: 'critical',
              evidence: `Input field reflects: ${payload}`,
              recommendation: 'Implement proper input sanitization and use Content Security Policy.'
            });
            break;
          }
        } catch (err) {
          console.log('Error testing XSS payload:', err);
        }
      }
    }
  }

  async scanSSL(): Promise<{ valid: boolean; issuer?: string; expiryDate?: string; protocols?: string[] }> {
    console.log('Scanning SSL/TLS configuration...');
    try {
      const sslInfo = await this.page.evaluate(async () => {
        const response = await fetch(window.location.href);
        return {
          protocol: response.url.startsWith('https') ? 'https' : 'http',
          securityState: (navigator as any).connection?.securityState,
        };
      });

      if (sslInfo.protocol !== 'https') {
        this.addVulnerability({
          type: 'Insecure Protocol',
          description: 'Website is not using HTTPS',
          severity: 'critical',
          recommendation: 'Enable HTTPS and redirect all HTTP traffic to HTTPS.'
        });
        return { valid: false };
      }

      return {
        valid: true,
        protocols: ['TLS 1.2', 'TLS 1.3'], // Basic assumption for modern websites
      };
    } catch (err) {
      console.error('Error scanning SSL:', err);
      return { valid: false };
    }
  }

  async scanCookies(): Promise<void> {
    console.log('Scanning cookie security...');
    const cookies = await this.page.cookies();
    
    for (const cookie of cookies) {
      if (!cookie.secure) {
        this.addVulnerability({
          type: 'Insecure Cookie',
          description: `Cookie "${cookie.name}" is not secure`,
          severity: 'high',
          recommendation: 'Set the Secure flag for all cookies.'
        });
      }
      if (!cookie.httpOnly) {
        this.addVulnerability({
          type: 'Cookie XSS Risk',
          description: `Cookie "${cookie.name}" is accessible via JavaScript`,
          severity: 'medium',
          recommendation: 'Set the HttpOnly flag for cookies that don\'t need JavaScript access.'
        });
      }
    }
  }

  async runAllScans(): Promise<{
    vulnerabilities: SecurityVulnerability[];
    summary: { critical: number; high: number; medium: number; low: number; };
    ssl: { valid: boolean; issuer?: string; expiryDate?: string; protocols?: string[]; };
    headers: { missing: string[]; misconfigured: string[]; };
  }> {
    await Promise.all([
      this.scanHeaders(),
      this.scanXSS(),
      this.scanCookies(),
    ]);

    const ssl = await this.scanSSL();

    // Calculate summary
    const summary = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    for (const vuln of this.vulnerabilities) {
      summary[vuln.severity]++;
    }

    return {
      vulnerabilities: this.vulnerabilities,
      summary,
      ssl,
      headers: {
        missing: this.missingHeaders,
        misconfigured: this.misconfiguredHeaders,
      }
    };
  }
}
