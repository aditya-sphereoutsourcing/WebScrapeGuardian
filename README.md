# Website Testing Platform

A sophisticated web-based automated testing platform designed to streamline website quality assurance through comprehensive browser-based testing and reporting.

## 🚀 Features

- Automated website testing with Puppeteer
- Real-time test progress monitoring
- Comprehensive PDF report generation
- Security vulnerability scanning
- Performance metrics analysis
- Broken link detection

## 🛠️ Tech Stack

- **Frontend**: React + TypeScript
- **Backend**: Express.js + TypeScript
- **Testing Engine**: Puppeteer-core
- **PDF Generation**: PDFKit
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: TanStack Query
- **Form Handling**: React Hook Form + Zod

## 📁 Project Structure

```
├── client/                  # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── lib/           # Utility functions
│   │   └── hooks/         # Custom React hooks
├── server/                 # Backend Express application
│   ├── testing/           # Test runner implementation
│   ├── pdf/               # PDF report generation
│   └── routes.ts          # API endpoints
└── shared/                # Shared TypeScript types
```

## 🔍 Key Components

### Backend Components

1. **Test Runner** (`server/testing/runner.ts`)
   - Manages browser automation with Puppeteer
   - Collects performance metrics
   - Checks for broken links
   - Performs security scans

2. **PDF Generator** (`server/pdf/generator.ts`)
   - Creates detailed PDF reports
   - Includes test results and metrics
   - Formats data for readability

3. **Storage** (`server/storage.ts`)
   - Manages test data
   - Handles test status updates
   - Stores test results

### Frontend Components

1. **Dashboard** (`client/src/pages/dashboard.tsx`)
   - Main interface for test management
   - Real-time test status updates
   - Results visualization

2. **Test Form** (`client/src/components/test-form.tsx`)
   - URL input with validation
   - Permission confirmation
   - Test initiation

3. **Test Results** (`client/src/components/test-results.tsx`)
   - Real-time progress updates
   - Performance metrics display
   - Security vulnerability reporting
   - PDF report download

## 🚦 Testing Process

1. **Initialization**
   - User submits URL and confirms permissions
   - Backend creates test record
   - Frontend begins polling for updates

2. **Test Execution**
   - Browser automation starts
   - Navigation timing captured
   - Links validated
   - Security headers checked
   - Performance metrics collected

3. **Results Processing**
   - Data aggregated into structured format
   - Results stored in memory
   - Frontend updated in real-time
   - PDF report generated

## 🔧 API Endpoints

- `POST /api/tests`
  - Create new test
  - Body: `{ url: string, permission: boolean }`

- `GET /api/tests/:id`
  - Get test status and results
  - Returns test details and results if complete

- `GET /api/tests/:id/pdf`
  - Download PDF report
  - Generated from test results

## 💻 Running the Project

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Access the application:
   - Frontend: `http://localhost:5000`
   - API: `http://localhost:5000/api`

## 🔒 Security Considerations

- Permission verification required before testing
- Secure PDF generation
- Rate limiting recommended for production
- Input validation using Zod schemas
- Security header validation

## 🎯 Future Enhancements

- Advanced accessibility testing
- Comprehensive security scanning
- Test scheduling and automation
- Custom test scenario creation
- Historical test comparison

## ⚠️ Important Notes

- Use only on websites you have permission to test
- Consider rate limiting for production deployments
- Some tests may require additional browser configurations
- Results accuracy depends on network conditions
