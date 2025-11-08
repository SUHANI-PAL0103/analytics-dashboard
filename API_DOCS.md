# API Documentation

Complete reference for all backend endpoints in the Analytics Dashboard API.

**Base URL (Development):** `http://localhost:4000`  
**Base URL (Production):** `https://your-api-domain.com`

---

## 🔐 Authentication

Currently, the API does not require authentication for most endpoints. In production, consider adding:
- API keys for external access
- JWT tokens for user authentication
- Rate limiting

The `/chat-with-data` endpoint forwards to Vanna AI, which requires an API key configured in backend environment variables.

---

## 📊 Endpoints

### 1. Health Check

**GET** `/health`

Check if the API server is running.

**Request:**
```http
GET /health HTTP/1.1
Host: localhost:4000
```

**Response:**
```json
{
  "ok": true,
  "timestamp": "2024-11-08T10:30:00.000Z"
}
```

**Status Codes:**
- `200 OK` - Service is healthy

---

### 2. Dashboard Statistics

**GET** `/stats`

Returns aggregated statistics for the dashboard overview cards.

**Request:**
```http
GET /stats HTTP/1.1
Host: localhost:4000
```

**Response:**
```json
{
  "total_spend_ytd": 123456.78,
  "total_invoices": 234,
  "documents_uploaded": 234,
  "average_invoice_value": 527.16
}
```

**Fields:**
- `total_spend_ytd` (number): Sum of all invoice totals from start of current year
- `total_invoices` (number): Total count of invoices in database
- `documents_uploaded` (number): Same as total_invoices (represents uploaded documents)
- `average_invoice_value` (number): Mean invoice total across all invoices

**Status Codes:**
- `200 OK` - Success
- `500 Internal Server Error` - Database query failed

**Example (PowerShell):**
```powershell
Invoke-RestMethod -Uri "http://localhost:4000/stats"
```

---

### 3. Invoice Trends

**GET** `/invoice-trends`

Returns time-series data showing invoice volume and spend by month.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `start` | string (ISO date) | No | Start date (default: start of current year) |
| `end` | string (ISO date) | No | End date (default: current date) |

**Request:**
```http
GET /invoice-trends?start=2024-01-01&end=2024-11-01 HTTP/1.1
Host: localhost:4000
```

**Response:**
```json
[
  {
    "month": "2024-01",
    "invoice_count": 15,
    "spend": 12345.67
  },
  {
    "month": "2024-02",
    "invoice_count": 18,
    "spend": 14567.89
  }
]
```

**Fields:**
- `month` (string): Year-month in YYYY-MM format
- `invoice_count` (number): Number of invoices issued in that month
- `spend` (number): Total spend (sum of invoice totals) for that month

**Status Codes:**
- `200 OK` - Success
- `500 Internal Server Error` - Query failed

**Example:**
```powershell
Invoke-RestMethod -Uri "http://localhost:4000/invoice-trends?start=2024-01-01"
```

---

### 4. Top Vendors

**GET** `/vendors/top10`

Returns the top 10 vendors ranked by total spend.

**Request:**
```http
GET /vendors/top10 HTTP/1.1
Host: localhost:4000
```

**Response:**
```json
[
  {
    "vendor_id": "cuid1a2b3c",
    "vendor_name": "Acme Corporation",
    "spend": 54321.00
  },
  {
    "vendor_id": "cuid4d5e6f",
    "vendor_name": "Global Supplies Ltd",
    "spend": 43210.00
  }
]
```

**Fields:**
- `vendor_id` (string): Unique vendor identifier
- `vendor_name` (string): Vendor business name
- `spend` (number): Total spend across all invoices from this vendor

**Sorting:** Results are ordered by `spend` descending (highest first)

**Status Codes:**
- `200 OK` - Success
- `500 Internal Server Error` - Query failed

**Example:**
```powershell
$vendors = Invoke-RestMethod -Uri "http://localhost:4000/vendors/top10"
$vendors | Format-Table
```

---

### 5. Category Spend

**GET** `/category-spend`

Returns spend aggregated by invoice line item categories.

**Request:**
```http
GET /category-spend HTTP/1.1
Host: localhost:4000
```

**Response:**
```json
[
  {
    "category": "Office Supplies",
    "spend": 12345.67
  },
  {
    "category": "Services",
    "spend": 9876.54
  },
  {
    "category": "Uncategorized",
    "spend": 3456.78
  }
]
```

**Fields:**
- `category` (string): Line item category name (or "Uncategorized")
- `spend` (number): Total spend for this category

**Sorting:** Results are ordered by `spend` descending

**Status Codes:**
- `200 OK` - Success
- `500 Internal Server Error` - Query failed

---

### 6. Cash Outflow Forecast

**GET** `/cash-outflow`

Returns expected future cash outflows based on unpaid invoices grouped by due date.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `start` | string (ISO date) | No | Start date (default: today) |
| `end` | string (ISO date) | No | End date (default: 3 months from today) |

**Request:**
```http
GET /cash-outflow?start=2024-11-01&end=2025-01-31 HTTP/1.1
Host: localhost:4000
```

**Response:**
```json
[
  {
    "date": "2024-11-15",
    "expected_outflow": 5000.00
  },
  {
    "date": "2024-12-01",
    "expected_outflow": 7500.50
  }
]
```

**Fields:**
- `date` (string): Due date (ISO date format)
- `expected_outflow` (number): Sum of unpaid invoice amounts due on this date

**Logic:** Only includes invoices with status != 'paid' and calculates remaining balance after payments

**Status Codes:**
- `200 OK` - Success
- `500 Internal Server Error` - Query failed

---

### 7. Invoices (Paginated)

**GET** `/invoices`

Returns a paginated list of invoices with search and filter capabilities.

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | 1 | Page number (1-indexed) |
| `limit` | number | No | 50 | Results per page |
| `search` | string | No | - | Search term (matches vendor name, invoice number, customer name) |
| `status` | string | No | - | Filter by status (`paid`, `pending`, `overdue`) |
| `sort` | string | No | `issueDate_desc` | Sort field and order (e.g., `total_asc`, `issueDate_desc`) |

**Request:**
```http
GET /invoices?page=1&limit=10&search=acme&status=paid&sort=total_desc HTTP/1.1
Host: localhost:4000
```

**Response:**
```json
{
  "data": [
    {
      "id": "cuid123abc",
      "invoice_number": "INV-2024-001",
      "vendor_name": "Acme Corporation",
      "customer_name": "John Doe",
      "issue_date": "2024-11-01T00:00:00.000Z",
      "due_date": "2024-12-01T00:00:00.000Z",
      "status": "paid",
      "subtotal": 1000.00,
      "tax": 100.00,
      "total": 1100.00,
      "currency": "USD"
    }
  ],
  "total": 234,
  "page": 1,
  "limit": 10,
  "totalPages": 24
}
```

**Response Fields:**
- `data` (array): Array of invoice objects
- `total` (number): Total count of invoices matching filters
- `page` (number): Current page number
- `limit` (number): Results per page
- `totalPages` (number): Total pages available

**Invoice Object Fields:**
- `id` (string): Unique invoice ID
- `invoice_number` (string): Human-readable invoice number
- `vendor_name` (string): Vendor name
- `customer_name` (string): Customer name
- `issue_date` (string ISO): Date invoice was issued
- `due_date` (string ISO | null): Payment due date
- `status` (string): Invoice status (`paid`, `pending`, `overdue`)
- `subtotal` (number): Amount before tax
- `tax` (number): Tax amount
- `total` (number): Total amount (subtotal + tax)
- `currency` (string): Currency code (e.g., "USD", "EUR")

**Search Behavior:**
- Case-insensitive
- Searches across: vendor name, customer name, invoice number
- Uses partial matching (contains)

**Sort Options:**
- `issueDate_asc` / `issueDate_desc`
- `total_asc` / `total_desc`
- `status_asc` / `status_desc`
- `invoiceNumber_asc` / `invoiceNumber_desc`

**Status Codes:**
- `200 OK` - Success
- `500 Internal Server Error` - Query failed

**Example:**
```powershell
# Get first page of paid invoices sorted by total (highest first)
$invoices = Invoke-RestMethod -Uri "http://localhost:4000/invoices?page=1&limit=20&status=paid&sort=total_desc"

# Search for invoices containing "software"
$results = Invoke-RestMethod -Uri "http://localhost:4000/invoices?search=software"
```

---

### 8. Chat with Data

**POST** `/chat-with-data`

Accepts natural language queries, generates SQL via Vanna AI (Groq LLM), executes query on database, and returns results.

**Request:**
```http
POST /chat-with-data HTTP/1.1
Host: localhost:4000
Content-Type: application/json

{
  "query": "What is the total spend in the last 90 days?"
}
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `query` | string | Yes | Natural language question about the data |

**Response:**
```json
{
  "sql": "SELECT SUM(total) as total_spend FROM \"Invoice\" WHERE \"issueDate\" >= '2024-08-10' LIMIT 1000;",
  "rows": [
    {
      "total_spend": 123456.78
    }
  ],
  "columns": ["total_spend"],
  "metadata": {
    "elapsed_ms": 427,
    "row_count": 1,
    "query": "What is the total spend in the last 90 days?"
  }
}
```

**Response Fields:**
- `sql` (string): Generated SQL query
- `rows` (array): Array of result rows (objects)
- `columns` (array): Column names in result set
- `metadata` (object): Query execution metadata
  - `elapsed_ms` (number): Query execution time
  - `row_count` (number): Number of rows returned
  - `query` (string): Original natural language query

**Example Queries:**
```
"Show top 5 vendors by spend"
"List all overdue invoices"
"What is the average invoice value per vendor?"
"How many invoices were processed in October 2024?"
"Show all invoices above $1000"
```

**Security Notes:**
- Only SELECT queries are allowed (enforced by Vanna AI)
- Queries are validated to prevent SQL injection
- Results are limited to prevent excessive data transfer
- API key required for Vanna AI service (configured in backend)

**Status Codes:**
- `200 OK` - Query successful
- `400 Bad Request` - Invalid query or missing required field
- `500 Internal Server Error` - Vanna AI service error or database error

**Error Response:**
```json
{
  "error": "Failed to process query",
  "message": "Vanna API error: timeout"
}
```

**Example (PowerShell):**
```powershell
$body = @{
    query = "Show top 5 vendors by spend in 2024"
} | ConvertTo-Json

$result = Invoke-RestMethod -Uri "http://localhost:4000/chat-with-data" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

# Display generated SQL
Write-Host $result.sql

# Display results
$result.rows | Format-Table
```

**Example (curl):**
```bash
curl -X POST http://localhost:4000/chat-with-data \
  -H "Content-Type: application/json" \
  -d '{"query":"What is the total spend in the last 90 days?"}'
```

---

## 🔄 Rate Limiting (Production Recommendation)

In production, implement rate limiting:

```javascript
// Example using express-rate-limit
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.'
});

app.use('/chat-with-data', limiter);
```

---

## 🐛 Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error type or message",
  "message": "Detailed error description"
}
```

**Common HTTP Status Codes:**
- `200 OK` - Successful request
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Missing or invalid authentication
- `404 Not Found` - Endpoint not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server or database error

---

## 📝 Notes

1. **Dates:** All dates are in ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)
2. **Numbers:** All monetary values are returned as numbers (not strings)
3. **Null Values:** Missing or null values are represented as `null`, not omitted
4. **Pagination:** Use `page` and `limit` parameters for large datasets
5. **CORS:** Enabled for all origins in development; configure for specific domains in production

---

## 🧪 Testing

### Postman Collection

Import this JSON to Postman for quick testing:

```json
{
  "info": {
    "name": "Analytics Dashboard API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/health"
      }
    },
    {
      "name": "Get Stats",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/stats"
      }
    },
    {
      "name": "Get Top Vendors",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/vendors/top10"
      }
    },
    {
      "name": "Chat Query",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"query\":\"Show top 5 vendors\"}"
        },
        "url": "{{base_url}}/chat-with-data"
      }
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:4000"
    }
  ]
}
```

---

**For support or bug reports, please open an issue on GitHub.**
