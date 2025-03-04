import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTestSchema } from "@shared/schema";
import { runTests } from "./testing/runner";
import { generatePDF } from "./pdf/generator";

export async function registerRoutes(app: Express): Promise<Server> {
  app.post('/api/tests', async (req, res) => {
    console.log('Received test request:', req.body);
    try {
      const data = insertTestSchema.parse(req.body);
      const test = await storage.createTest(data);
      console.log('Created test:', test);

      // Start tests asynchronously
      runTests(test.id, data.url).catch(err => {
        console.error('Error running tests:', err);
      });

      res.json(test);
    } catch (err) {
      console.error('Invalid request data:', err);
      res.status(400).json({ error: 'Invalid request data' });
    }
  });

  app.get('/api/tests/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    console.log('Fetching test:', id);
    const test = await storage.getTest(id);

    if (!test) {
      console.log('Test not found:', id);
      res.status(404).json({ error: 'Test not found' });
      return;
    }

    res.json(test);
  });

  app.get('/api/tests/:id/pdf', async (req, res) => {
    const id = parseInt(req.params.id);
    console.log('Generating PDF for test:', id);
    const test = await storage.getTest(id);

    if (!test || !test.results) {
      console.log('Test results not found:', id);
      res.status(404).json({ error: 'Test results not found' });
      return;
    }

    try {
      const pdf = await generatePDF(test);
      console.log('PDF generated successfully');

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=test-report-${id}.pdf`);
      res.send(pdf);
    } catch (err) {
      console.error('Error generating PDF:', err);
      res.status(500).json({ error: 'Failed to generate PDF' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}