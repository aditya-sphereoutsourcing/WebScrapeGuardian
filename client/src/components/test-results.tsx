import { useQuery } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Clock, Download } from "lucide-react";
import type { Test } from "@shared/schema";

interface TestResultsProps {
  test: Test;
}

export default function TestResults({ test }: TestResultsProps) {
  const { data: currentTest } = useQuery({
    queryKey: ['/api/tests', test.id],
    initialData: test,
    enabled: test.status !== 'completed' && test.status !== 'failed',
    refetchInterval: (data) => 
      data?.status === 'pending' || data?.status === 'running' ? 1000 : false,
  });
  
  const downloadReport = async () => {
    const response = await fetch(`/api/tests/${test.id}/pdf`);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-report-${test.id}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <StatusIcon status={currentTest.status} />
        <div className="flex-1">
          <h3 className="font-medium">
            {currentTest.status === 'pending' && 'Initializing Test...'}
            {currentTest.status === 'running' && 'Running Tests...'}
            {currentTest.status === 'completed' && 'Tests Completed'}
            {currentTest.status === 'failed' && 'Tests Failed'}
          </h3>
          {(currentTest.status === 'pending' || currentTest.status === 'running') && (
            <Progress className="mt-2" value={currentTest.status === 'running' ? 50 : 10} />
          )}
        </div>
      </div>
      
      {currentTest.results && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Performance</h4>
              <p>Load Time: {currentTest.results.performance.loadTime}ms</p>
              <p>Response Time: {currentTest.results.performance.responseTime}ms</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Security</h4>
              <p>{currentTest.results.security.vulnerabilities.length} vulnerabilities found</p>
            </div>
          </div>
          
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
