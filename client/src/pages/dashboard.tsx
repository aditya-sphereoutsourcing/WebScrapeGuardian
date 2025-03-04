import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import TestForm from "@/components/test-form";
import TestResults from "@/components/test-results";
import { useState } from "react";
import type { Test } from "@shared/schema";

export default function Dashboard() {
  const [currentTest, setCurrentTest] = useState<Test | null>(null);
  
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Website Testing Tool
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Run comprehensive tests on your website to analyze performance, security, and functionality.
            </p>
            <TestForm onTestCreated={setCurrentTest} />
          </CardContent>
        </Card>
        
        {currentTest && (
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <TestResults test={currentTest} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
