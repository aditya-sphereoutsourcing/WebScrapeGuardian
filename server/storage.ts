import { tests, type Test, type InsertTest, type TestResult } from "@shared/schema";

export interface IStorage {
  createTest(test: InsertTest): Promise<Test>;
  getTest(id: number): Promise<Test | undefined>;
  updateTestStatus(id: number, status: string): Promise<Test | undefined>;
  updateTestResults(id: number, results: TestResult): Promise<Test | undefined>;
}

export class MemStorage implements IStorage {
  private tests: Map<number, Test>;
  private currentId: number;

  constructor() {
    this.tests = new Map();
    this.currentId = 1;
  }

  async createTest(insertTest: InsertTest): Promise<Test> {
    const id = this.currentId++;
    const test: Test = {
      ...insertTest,
      id,
      status: 'pending',
      results: null,
      createdAt: new Date(),
    };
    this.tests.set(id, test);
    return test;
  }

  async getTest(id: number): Promise<Test | undefined> {
    return this.tests.get(id);
  }

  async updateTestStatus(id: number, status: string): Promise<Test | undefined> {
    const test = this.tests.get(id);
    if (!test) return undefined;
    
    const updated = { ...test, status };
    this.tests.set(id, updated);
    return updated;
  }

  async updateTestResults(id: number, results: TestResult): Promise<Test | undefined> {
    const test = this.tests.get(id);
    if (!test) return undefined;
    
    const updated = { ...test, results, status: 'completed' };
    this.tests.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
