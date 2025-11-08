# Chat with Data - Example Questions

Natural language queries you can ask about your invoice data.

## 💡 Quick Examples

### Getting Started (Simple)
```
What is the total spend?
How many invoices do we have?
Show me all vendors
List all invoices
```

### Vendor Analysis
```
Which vendor has the highest spend?
Show me invoices from Global Supply
How many invoices does each vendor have?
List top 5 vendors by total amount
```

### Financial Queries
```
What's the total of all paid invoices?
Show me invoices over 10000 euros
What's the average invoice value?
List invoices between 5000 and 15000 euros
```

### Date Filtering
```
Show me invoices from October 2025
What was the spend in the last 30 days?
List invoices issued after 2025-09-01
Which month had the most invoices?
```

### Category Breakdown
```
How much did we spend on Operations?
Show me all Marketing category invoices
What's the total by category?
List categories with their spending
```

### Status Tracking
```
How many paid invoices are there?
Show me all pending invoices
What's the total of unpaid invoices?
List overdue invoices
```

### Customer Information
```
Show me invoices for Blechbearbeitung GmbH
Which customer has the most invoices?
List all customers
```

### Detailed Searches
```
Show me invoice INV-2025-001
Find all invoices with line items over 3000
What are the payment details for paid invoices?
```

## 🎓 Tips for Best Results

1. **Be specific**: "Show invoices from October" works better than "recent invoices"
2. **Use table names**: Vendor, Invoice, Customer, LineItem, Payment
3. **Use column names**: total, issueDate, status, category
4. **Ask one thing at a time**: Break complex queries into steps
5. **Check the SQL**: Review the generated SQL to see what it's doing

## 🔧 Technical Details

The system:
1. Takes your natural language question
2. Sends it to Groq LLM (Mixtral-8x7b model)
3. LLM generates PostgreSQL SQL based on your database schema
4. SQL is validated (only SELECT queries allowed)
5. Executed on your PostgreSQL database
6. Results displayed in a table

## 🗄️ Your Database Schema

**Tables:**
- `Invoice` - invoiceNumber, total, issueDate, dueDate, status
- `Vendor` - name, taxId, address, email
- `Customer` - name, email, address
- `LineItem` - description, quantity, price, total, category
- `Payment` - amount, method, paidAt

**Example SQL Generated:**
```sql
-- For: "What is the total spend?"
SELECT SUM(total) as total_spend FROM "Invoice";

-- For: "Show top 5 vendors by spend"
SELECT v.name, SUM(i.total) as total 
FROM "Vendor" v 
JOIN "Invoice" i ON v.id = i."vendorId" 
GROUP BY v.name 
ORDER BY total DESC 
LIMIT 5;
```

## 🚀 Try It Now!

Go to: **http://localhost:3000/dashboard/chat**

Start with simple questions and work your way up to complex analytics!
