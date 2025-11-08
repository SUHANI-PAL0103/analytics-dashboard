# Analytics Dashboard - Production Full-Stack Application

A production-grade full-stack analytics dashboard with AI-powered natural language query capabilities, built with modern technologies including Next.js, Express, PostgreSQL, and Vanna AI powered by Groq.

## 🎯 Overview

This application consists of three main components:

1. **Interactive Analytics Dashboard** - Real-time invoice analytics with charts and metrics
2. **Chat with Data** - Natural language interface powered by Vanna AI (self-hosted) and Groq LLM
3. **Backend API** - Express.js REST API with PostgreSQL database

## 🏗️ Architecture

```
analytics-mono/
├── apps/
│   ├── web/          # Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui
│   └── api/          # Express.js + Prisma + PostgreSQL
├── services/
│   └── vanna/        # Python FastAPI + Vanna AI + Groq
├── data/
│   └── Analytics_Test_Data.json
└── docker-compose.yml
```

### Tech Stack

**Frontend (apps/web)**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Chart.js & react-chartjs-2

**Backend (apps/api)**
- Node.js + Express.js
- TypeScript
- Prisma ORM
- PostgreSQL

**AI Service (services/vanna)**
- Python 3.11
- FastAPI
- Vanna AI
- Groq LLM API
- asyncpg (PostgreSQL driver)

## 📋 Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- Docker & Docker Compose
- Git

## 🚀 Quick Start

### 1. Clone and Install Dependencies

```powershell
# Clone the repository (or navigate to your repo)
cd analytics-mono

# Install root dependencies
npm install

# Install API dependencies
cd apps\api
npm install

# Install web dependencies
cd ..\web
npm install

# Go back to root
cd ..\..
```

### 2. Set Up Python Environment for Vanna Service

```powershell
# Navigate to Vanna service
cd services\vanna

# Create virtual environment
python -m venv .venv

# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Go back to root
cd ..\..
```

### 3. Configure Environment Variables

Create `.env` files with the following content:

**Root `.env` (copy from `.env.example`)**
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/analytics
VANNA_API_KEY=your-secret-key-here
VANNA_API_BASE_URL=http://localhost:8000
GROQ_API_KEY=your-groq-api-key-here
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**apps/api/.env**
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/analytics
PORT=4000
VANNA_API_BASE_URL=http://localhost:8000
VANNA_API_KEY=your-secret-key-here
```

**apps/web/.env.local**
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**services/vanna/.env**
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/analytics
GROQ_API_KEY=your-groq-api-key-here
VANNA_API_KEY=your-secret-key-here
PORT=8000
```

> **Note:** Get your free Groq API key from https://console.groq.com/

### 4. Start PostgreSQL Database

```powershell
# Start PostgreSQL container
docker compose up -d

# Verify it's running
docker compose ps
```

### 5. Initialize Database & Seed Data

```powershell
# Navigate to API directory
cd apps\api

# Run Prisma migrations
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# Seed database with Analytics_Test_Data.json
npm run db:seed

# Verify data
npx prisma studio  # Opens GUI at http://localhost:5555
```

Expected output after seeding:
```
✅ Seed completed!
   - Processed: XXX
   - Skipped: X
📊 Database Summary:
   - Total Invoices: XXX
   - Total Spend: $XXXXX.XX
   - Average Invoice: $XX.XX
```

### 6. Start Development Servers

**Option 1: Start all services at once**
```powershell
# From root directory
npm run dev:all
```

**Option 2: Start services individually (recommended for debugging)**

```powershell
# Terminal 1: Start API (from root)
npm run dev:api
# API will run on http://localhost:4000

# Terminal 2: Start Frontend (from root)
npm run dev:web
# Frontend will run on http://localhost:3000

# Terminal 3: Start Vanna AI Service
cd services\vanna
.\.venv\Scripts\Activate.ps1
python -m uvicorn main:app --reload --port 8000
# Vanna will run on http://localhost:8000
```

### 7. Access the Application

- **Dashboard**: http://localhost:3000/dashboard
- **Chat Interface**: http://localhost:3000/dashboard/chat
- **API Health**: http://localhost:4000/health
- **Vanna Health**: http://localhost:8000/health
- **Prisma Studio**: http://localhost:5555

## 📊 Database Schema

### Entity Relationship Diagram

```
┌─────────┐         ┌──────────┐         ┌──────────┐
│ Vendor  │────┬────│ Invoice  │────┬────│ Customer │
└─────────┘    │    └──────────┘    │    └──────────┘
               │         │           │
               │         ├───────────┤
               │         │           │
          ┌────▼────┐  ┌─▼────────┐
          │LineItem │  │ Payment  │
          └─────────┘  └──────────┘
```

**Tables:**
- `Vendor` - Vendor details (name, tax ID, address)
- `Customer` - Customer information
- `Invoice` - Invoice records (amounts, dates, status)
- `LineItem` - Invoice line items (products/services, quantities)
- `Payment` - Payment transactions

**Key Relationships:**
- Vendor → Invoice (1:N)
- Customer → Invoice (1:N)
- Invoice → LineItem (1:N)
- Invoice → Payment (1:N)

## 🔌 API Documentation

### Base URL
`http://localhost:4000`

### Endpoints

#### 1. GET `/stats`
Returns overview statistics.

**Response:**
```json
{
  "total_spend_ytd": 123456.78,
  "total_invoices": 234,
  "documents_uploaded": 234,
  "average_invoice_value": 527.16
}
```

#### 2. GET `/invoice-trends`
Returns monthly invoice trends.

**Query Parameters:**
- `start` (optional): Start date (YYYY-MM-DD)
- `end` (optional): End date (YYYY-MM-DD)

**Response:**
```json
[
  {
    "month": "2024-01",
    "invoice_count": 15,
    "spend": 12345.67
  }
]
```

#### 3. GET `/vendors/top10`
Returns top 10 vendors by spend.

**Response:**
```json
[
  {
    "vendor_id": "cuid123",
    "vendor_name": "Acme Corp",
    "spend": 54321.00
  }
]
```

#### 4. GET `/category-spend`
Returns spend grouped by category.

**Response:**
```json
[
  {
    "category": "Office Supplies",
    "spend": 12345.67
  }
]
```

#### 5. GET `/cash-outflow`
Returns expected cash outflow forecast.

**Query Parameters:**
- `start` (optional): Start date
- `end` (optional): End date

**Response:**
```json
[
  {
    "date": "2024-12-01",
    "expected_outflow": 5000.00
  }
]
```

#### 6. GET `/invoices`
Returns paginated invoices with filters.

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 50)
- `search` (string): Search term
- `status` (string): Filter by status
- `sort` (string): Sort field and order (e.g., `issueDate_desc`)

**Response:**
```json
{
  "data": [
    {
      "id": "cuid123",
      "invoice_number": "INV-001",
      "vendor_name": "Acme Corp",
      "customer_name": "John Doe",
      "issue_date": "2024-11-01T00:00:00Z",
      "due_date": "2024-12-01T00:00:00Z",
      "status": "paid",
      "total": 1234.56,
      "currency": "USD"
    }
  ],
  "total": 234,
  "page": 1,
  "limit": 50,
  "totalPages": 5
}
```

#### 7. POST `/chat-with-data`
Natural language query interface (proxies to Vanna AI).

**Request:**
```json
{
  "query": "What is the total spend in the last 90 days?"
}
```

**Response:**
```json
{
  "sql": "SELECT SUM(total) FROM \"Invoice\" WHERE \"issueDate\" >= '2024-08-10';",
  "rows": [
    { "sum": 123456.78 }
  ],
  "columns": ["sum"],
  "metadata": {
    "elapsed_ms": 42,
    "row_count": 1,
    "query": "What is the total spend in the last 90 days?"
  }
}
```

## 🤖 Chat with Data Workflow

```
┌──────────┐    Natural Language    ┌──────────┐
│ Frontend │ ────────────────────►  │ Backend  │
│ (Next.js)│                        │ (Express)│
└──────────┘                        └────┬─────┘
                                         │
                                         ▼
                                    ┌────────────┐
                                    │ Vanna AI   │
                                    │ (FastAPI)  │
                                    └─────┬──────┘
                                          │
                          ┌───────────────┼───────────────┐
                          │               │               │
                          ▼               ▼               ▼
                     ┌────────┐     ┌─────────┐    ┌──────────┐
                     │ Schema │────►│ Groq AI │    │PostgreSQL│
                     │ Info   │     │ LLM     │    │ Database │
                     └────────┘     └────┬────┘    └─────▲────┘
                                         │               │
                                         ▼               │
                                    ┌─────────┐          │
                                    │Generated│          │
                                    │   SQL   │──────────┘
                                    └─────────┘
```

**Flow Steps:**
1. User enters natural language query in frontend
2. Frontend sends query to backend `/chat-with-data`
3. Backend proxies to Vanna AI service `/generate`
4. Vanna retrieves database schema
5. Vanna sends schema + query to Groq LLM
6. Groq generates SQL query
7. Vanna validates SQL (security check: SELECT only)
8. Vanna executes SQL on PostgreSQL
9. Results flow back: Vanna → Backend → Frontend
10. Frontend displays SQL + results table

## 🧪 Testing

### API Endpoint Tests

```powershell
# Test stats endpoint
curl http://localhost:4000/stats

# Test invoices
curl "http://localhost:4000/invoices?page=1&limit=10"

# Test top vendors
curl http://localhost:4000/vendors/top10

# Test chat (PowerShell)
Invoke-RestMethod -Uri "http://localhost:4000/chat-with-data" -Method POST -ContentType "application/json" -Body '{"query":"Show top 5 vendors"}'
```

### Database Verification

```powershell
# Open Prisma Studio
cd apps\api
npx prisma studio

# Or use psql
psql postgresql://postgres:password@localhost:5432/analytics -c "SELECT COUNT(*) FROM \"Invoice\";"
```

## 🚢 Deployment

### Frontend + Backend (Vercel)

1. **Push to GitHub**
```powershell
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Deploy on Vercel**
   - Import repository on Vercel
   - Root directory: `apps/web` for frontend
   - Build command: `npm run build`
   - Output directory: `.next`
   - Environment variables: Add `NEXT_PUBLIC_API_BASE_URL`, `DATABASE_URL`

3. **For API** (if deploying separately):
   - Root: `apps/api`
   - Build: `npm run build`
   - Start: `npm start`

### Vanna AI Service (Render/Railway/Fly.io)

**Option 1: Render**
1. Connect GitHub repo
2. Select `services/vanna` as root directory
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables: `DATABASE_URL`, `GROQ_API_KEY`, `VANNA_API_KEY`

**Option 2: Docker Deployment**
```powershell
# Build image
cd services\vanna
docker build -t vanna-ai .

# Run
docker run -p 8000:8000 --env-file .env vanna-ai
```

### Production Database

Use managed PostgreSQL (Supabase, Neon, Render Postgres, or DigitalOcean):
1. Create database instance
2. Update `DATABASE_URL` in all .env files
3. Run migrations: `npx prisma migrate deploy`
4. Seed data: `npm run db:seed`

## 📁 Project Structure

```
analytics-mono/
├── apps/
│   ├── web/                    # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── dashboard/
│   │   │   │   │   ├── page.tsx          # Main dashboard
│   │   │   │   │   ├── chat/page.tsx     # Chat interface
│   │   │   │   │   └── layout.tsx        # Dashboard layout
│   │   │   │   ├── layout.tsx            # Root layout
│   │   │   │   └── globals.css
│   │   │   ├── components/
│   │   │   │   ├── ui/                   # shadcn components
│   │   │   │   ├── charts/               # Chart components
│   │   │   │   └── InvoicesTable.tsx
│   │   │   └── lib/
│   │   │       ├── api.ts                # API client
│   │   │       └── utils.ts
│   │   ├── package.json
│   │   └── next.config.js
│   │
│   └── api/                    # Express backend
│       ├── src/
│       │   ├── index.ts
│       │   └── routes/
│       │       ├── stats.ts
│       │       ├── invoices.ts
│       │       ├── vendors.ts
│       │       ├── category.ts
│       │       ├── trends.ts
│       │       ├── cash-outflow.ts
│       │       └── chat.ts
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── seed.ts
│       └── package.json
│
├── services/
│   └── vanna/                  # Vanna AI service
│       ├── main.py
│       ├── requirements.txt
│       ├── Dockerfile
│       └── .env
│
├── data/
│   └── Analytics_Test_Data.json
│
├── package.json                # Root workspace config
├── docker-compose.yml
└── README.md
```

## 🛠️ Development Scripts

```powershell
# Root scripts
npm run dev:all       # Start all services
npm run dev:web       # Start frontend only
npm run dev:api       # Start API only
npm run build:all     # Build all apps
npm run db:migrate    # Run Prisma migrations
npm run db:seed       # Seed database
npm run db:studio     # Open Prisma Studio

# API scripts (from apps/api)
npm run dev           # Start dev server
npm run build         # Build TypeScript
npm run prisma:generate   # Generate Prisma client
npm run prisma:migrate    # Run migrations
npm run db:seed       # Seed data

# Web scripts (from apps/web)
npm run dev           # Start Next.js dev
npm run build         # Build for production
npm run start         # Start production server

# Vanna scripts (from services/vanna)
python -m uvicorn main:app --reload   # Dev mode
```

## 🔒 Security Features

- **SQL Injection Protection**: Vanna AI validates and sanitizes all generated SQL
- **Read-Only Queries**: Only SELECT statements allowed (no DDL/DML)
- **API Key Authentication**: Vanna service requires API key
- **CORS Configuration**: Restricted origins in production
- **Rate Limiting**: Recommended for production
- **Environment Variables**: Sensitive data in .env files (not committed)

## 🎁 Bonus Features Implemented

✅ Searchable, sortable invoices table
✅ Pagination for large datasets
✅ CSV export for query results
✅ Copy SQL functionality
✅ Real-time charts with Chart.js
✅ Responsive design (mobile-friendly)
✅ Loading states and error handling
✅ Docker Compose setup
✅ Full TypeScript coverage
✅ Prisma ORM with type safety

## 📝 Sample Natural Language Queries

Try these in the Chat interface:

- "What's the total spend in the last 90 days?"
- "List top 5 vendors by spend"
- "Show overdue invoices"
- "What is the average invoice value per vendor?"
- "How many invoices were processed in October 2024?"
- "Show me all invoices above $1000"
- "Which customer has the most invoices?"

## 🐛 Troubleshooting

**Issue: Database connection failed**
```powershell
# Check if Postgres is running
docker compose ps

# Restart database
docker compose restart db
```

**Issue: Prisma client not found**
```powershell
cd apps\api
npx prisma generate
```

**Issue: Vanna service not responding**
```powershell
# Check if Python venv is activated
cd services\vanna
.\.venv\Scripts\Activate.ps1

# Reinstall dependencies
pip install -r requirements.txt
```

**Issue: Frontend can't reach API**
- Verify `NEXT_PUBLIC_API_BASE_URL` in `apps/web/.env.local`
- Check API is running on port 4000
- Check CORS configuration in API

## 📧 Support

For issues or questions, please create an issue in the GitHub repository.

## 📄 License

MIT License - feel free to use this project for learning or production.

---

**Built with ❤️ using Next.js, Express, Prisma, Vanna AI, and Groq**
