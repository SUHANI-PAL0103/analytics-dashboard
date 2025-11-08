from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncpg
import os
import re
import time
from typing import Optional, List, Dict, Any
import httpx

app = FastAPI(title="Vanna AI Service", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your Vercel domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Environment variables
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/analytics")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
VANNA_API_KEY = os.getenv("VANNA_API_KEY", "your-secret-key-here")

# Database pool
db_pool: Optional[asyncpg.Pool] = None


class QueryRequest(BaseModel):
    query: str
    user_id: Optional[str] = None
    max_rows: Optional[int] = 1000


class QueryResponse(BaseModel):
    sql: str
    rows: List[Dict[str, Any]]
    columns: List[str]
    metadata: Dict[str, Any]


# API key validation
async def verify_api_key(x_api_key: str = Header(...)):
    if x_api_key != VANNA_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return x_api_key


@app.on_event("startup")
async def startup():
    global db_pool
    # Convert PostgreSQL URL to asyncpg format if needed
    db_url = DATABASE_URL.replace("postgresql://", "").replace("postgresql+psycopg://", "")
    db_pool = await asyncpg.create_pool(f"postgresql://{db_url}", min_size=2, max_size=10)
    print("✅ Database pool created")


@app.on_event("shutdown")
async def shutdown():
    if db_pool:
        await db_pool.close()
    print("👋 Database pool closed")


@app.get("/health")
async def health():
    return {"ok": True, "service": "vanna-ai", "timestamp": time.time()}


@app.post("/generate", response_model=QueryResponse)
async def generate_sql(request: QueryRequest, api_key: str = Depends(verify_api_key)):
    """
    Generate SQL from natural language query using Groq LLM,
    execute it, and return results.
    """
    start_time = time.time()
    
    try:
        # Get database schema
        schema_info = await get_schema_info()
        
        # Generate SQL using Groq
        sql_query = await generate_sql_with_groq(request.query, schema_info)
        
        # Validate SQL (security check)
        if not validate_sql(sql_query):
            raise HTTPException(
                status_code=400,
                detail="Generated SQL contains forbidden operations. Only SELECT queries are allowed."
            )
        
        # Execute SQL
        rows, columns = await execute_sql(sql_query, request.max_rows or 1000)
        
        elapsed_ms = int((time.time() - start_time) * 1000)
        
        return QueryResponse(
            sql=sql_query,
            rows=rows,
            columns=columns,
            metadata={
                "elapsed_ms": elapsed_ms,
                "row_count": len(rows),
                "query": request.query,
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in generate_sql: {e}")
        raise HTTPException(status_code=500, detail=f"Query generation failed: {str(e)}")


async def get_schema_info() -> str:
    """Get database schema information for context."""
    schema_query = """
        SELECT 
            table_name,
            column_name,
            data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
        ORDER BY table_name, ordinal_position;
    """
    
    async with db_pool.acquire() as conn:
        rows = await conn.fetch(schema_query)
    
    # Format schema as text
    schema_text = "Database Schema:\n\n"
    current_table = None
    
    for row in rows:
        if row['table_name'] != current_table:
            current_table = row['table_name']
            schema_text += f"\nTable: {current_table}\n"
        schema_text += f"  - {row['column_name']} ({row['data_type']})\n"
    
    return schema_text


async def generate_sql_with_groq(nl_query: str, schema: str) -> str:
    """Use Groq LLM to generate SQL from natural language."""
    
    if not GROQ_API_KEY:
        # Fallback: return a basic query if no API key
        return 'SELECT * FROM "Invoice" LIMIT 10;'
    
    prompt = f"""You are a SQL expert. Given the following PostgreSQL database schema and a natural language query, generate a valid SQL SELECT query.

{schema}

Important rules:
1. ONLY generate SELECT queries. Never use INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, or GRANT.
2. Use double quotes for table and column names (PostgreSQL convention).
3. Always include a LIMIT clause (max 1000 rows).
4. Return ONLY the SQL query, no explanations or markdown.
5. For date comparisons, use PostgreSQL date functions.

Natural language query: {nl_query}

SQL query:"""

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "mixtral-8x7b-32768",  # Fast Groq model
                    "messages": [
                        {"role": "system", "content": "You are a SQL expert. Generate only valid PostgreSQL SELECT queries."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.1,
                    "max_tokens": 500,
                },
                timeout=30.0,
            )
            response.raise_for_status()
            data = response.json()
            
            sql = data["choices"][0]["message"]["content"].strip()
            
            # Clean up SQL (remove markdown code blocks if present)
            sql = re.sub(r"```sql\s*", "", sql)
            sql = re.sub(r"```\s*", "", sql)
            sql = sql.strip()
            
            return sql
    
    except Exception as e:
        print(f"Groq API error: {e}")
        # Fallback query
        return f'SELECT * FROM "Invoice" LIMIT 10;  -- Groq API unavailable'


def validate_sql(sql: str) -> bool:
    """Validate that SQL only contains SELECT statements."""
    sql_upper = sql.upper()
    
    # List of forbidden keywords
    forbidden = [
        "INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "CREATE",
        "GRANT", "REVOKE", "TRUNCATE", "EXEC", "EXECUTE"
    ]
    
    for keyword in forbidden:
        if re.search(rf"\b{keyword}\b", sql_upper):
            return False
    
    # Must contain SELECT
    if "SELECT" not in sql_upper:
        return False
    
    return True


async def execute_sql(sql: str, max_rows: int) -> tuple:
    """Execute SQL query and return results."""
    
    # Ensure LIMIT is present
    if "LIMIT" not in sql.upper():
        sql = sql.rstrip(";") + f" LIMIT {max_rows};"
    
    async with db_pool.acquire() as conn:
        try:
            rows = await conn.fetch(sql)
            
            if not rows:
                return [], []
            
            # Convert to list of dicts
            columns = list(rows[0].keys())
            result_rows = []
            
            for row in rows:
                row_dict = {}
                for col in columns:
                    val = row[col]
                    # Convert types to JSON-serializable
                    if hasattr(val, 'isoformat'):  # datetime
                        row_dict[col] = val.isoformat()
                    elif hasattr(val, '__float__'):  # Decimal
                        row_dict[col] = float(val)
                    else:
                        row_dict[col] = val
                result_rows.append(row_dict)
            
            return result_rows, columns
        
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"SQL execution error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
