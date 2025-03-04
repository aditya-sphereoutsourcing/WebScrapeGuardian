import { pgTable, text, serial, integer, json, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const tests = pgTable("tests", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  permission: boolean("permission").notNull(),
  status: text("status").notNull(), // pending, running, completed, failed
  results: json("results").$type<TestResult | null>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTestSchema = createInsertSchema(tests).pick({
  url: true,
  permission: true,
});

export type InsertTest = z.infer<typeof insertTestSchema>;
export type Test = typeof tests.$inferSelect;

export type TestResult = {
  functional: {
    navigationTime: number;
    brokenLinks: string[];
  };
  performance: {
    loadTime: number;
    responseTime: number;
  };
  security: {
    vulnerabilities: Array<{
      type: string;
      description: string;
      severity: 'low' | 'medium' | 'high';
    }>;
  };
};