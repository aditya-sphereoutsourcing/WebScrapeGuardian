import { useQuery } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Clock, Download } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import LogBox from "./log-box";
import { useState, useEffect } from 'react';
import type { Test } from "@shared/schema";

interface TestResultsProps {
  test: Test;
}

export default function TestResults({ test }: TestResultsProps) {
  const { data: currentTest, error, isLoading } = useQuery({
    queryKey: [`/api/tests/${test.id}`],
    refetchInterval: (data) => {
      const status = data?.status || test.status;
      return status === 'pending' || status === 'running' ? 1000 : false;
    },
  });

  // Track test logs
  const [logs, setLogs] = useState<string[]>([]);

  // Update logs when test status changes
  useEffect(() => {
    if (!currentTest) return;

    const newLogs: string[] = [];

    if (currentTest.status === 'running') {
      newLogs.push(`Test running for ${currentTest.url}`);
    } else if (currentTest.status === 'completed') {
      newLogs.push('Test completed successfully');
    } else if (currentTest.status === 'failed') {
      newLogs.push('Test failed');
    }

    if (currentTest.results) {
      const { security, functional, performance } = currentTest.results;
      newLogs.push(
        `Navigation Time: ${functional.navigationTime}ms`,
        `Found ${functional.brokenLinks.length} broken links`,
        `Load Time: ${performance.loadTime}ms`,
        `Found ${security.vulnerabilities.length} security issues:`,
        `- Critical: ${security.summary.critical}`,
        `- High: ${security.summary.high}`,
        `- Medium: ${security.summary.medium}`,
        `- Low: ${security.summary.low}`
      );
    }

    setLogs(prev => [...prev, ...newLogs]);
  }, [currentTest]);

  const downloadReport = async () => {
    try {
      const response = await fetch(`/api/tests/${test.id}/pdf`);
      if (!response.ok) throw new Error('Failed to download report');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `test-report-${test.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading report:', err);
    }
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to fetch test results. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <Progress value={undefined} className="w-full" />
        <p className="text-center mt-2">Loading test results...</p>
      </div>
    );
  }

  const displayTest = currentTest || test;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <StatusIcon status={displayTest.status} />
        <div className="flex-1">
          <h3 className="font-medium">
            {displayTest.status === 'pending' && 'Initializing Test...'}
            {displayTest.status === 'running' && 'Running Tests...'}
            {displayTest.status === 'completed' && 'Tests Completed'}
            {displayTest.status === 'failed' && 'Tests Failed'}
          </h3>
          {(displayTest.status === 'pending' || displayTest.status === 'running') && (
            <Progress 
              className="mt-2" 
              value={displayTest.status === 'running' ? 50 : 10}
              indeterminate
            />
          )}
        </div>
      </div>

      {/* Log Box */}
      <LogBox logs={logs} className="mt-4" />

      {displayTest.results && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Performance</h4>
              <p>Load Time: {displayTest.results.performance.loadTime}ms</p>
              <p>Response Time: {displayTest.results.performance.responseTime}ms</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Security</h4>
              <p>{displayTest.results.security.vulnerabilities.length} vulnerabilities found</p>
              {displayTest.results.security.vulnerabilities.map((vuln, i) => (
                <div key={i} className="mt-2 text-sm">
                  <p className="font-medium">{vuln.type}</p>
                  <p className="text-muted-foreground">{vuln.description}</p>
                  <p className={`text-${vuln.severity === 'critical' ? 'red-600' : vuln.severity === 'high' ? 'red-500' : vuln.severity === 'medium' ? 'yellow-500' : 'blue-500'}`}>
                    Severity: {vuln.severity}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {displayTest.results.functional.brokenLinks.length > 0 && (
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Broken Links</h4>
              <ul className="list-disc list-inside space-y-1">
                {displayTest.results.functional.brokenLinks.map((link, i) => (
                  <li key={i} className="text-sm text-red-500">{link}</li>
                ))}
              </ul>
            </div>
          )}

          <Button
            onClick={downloadReport}
            variant="outline"
            className="w-full"
          >
            <Download className="mr-2 h-4 w-4" />
            Download PDF Report
          </Button>
        </div>
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-6 w-6 text-green-500" />;
    case 'failed':
      return <AlertCircle className="h-6 w-6 text-red-500" />;
    case 'running':
    case 'pending':
    default:
      return <Clock className="h-6 w-6 text-yellow-500 animate-spin" />;
  }
}