import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTestSchema } from "@shared/schema";
import { runTests } from "./testing/runner";
import { generatePDF } from "./pdf/generator";

export async function registerRoutes(app: Express): Promise<Server> {
  app.post('/api/tests', async (req, res) => {
    try {
      const data = insertTestSchema.parse(req.body);
      const test = await storage.createTest(data);
      
      // Start tests asynchronously
      runTests(test.id, data.url).catch(console.error);
      
      res.json(test);
    } catch (err) {
      res.status(400).json({ error: 'Invalid request data' });
    }
  });

  app.get('/api/tests/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const test = await storage.getTest(id);
    
    if (!test) {
      res.status(404).json({ error: 'Test not found' });
      return;
    }
    
    res.json(test);
  });

  app.get('/api/tests/:id/pdf', async (req, res) => {
    const id = parseInt(req.params.id);
    const test = await storage.getTest(id);
    
    if (!test || !test.results) {
      res.status(404).json({ error: 'Test results not found' });
      return;
    }
    
    const pdf = await generatePDF(test);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=test-report-${id}.pdf`);
    res.send(pdf);
  });

  const httpServer = createServer(app);
  return httpServer;
}
