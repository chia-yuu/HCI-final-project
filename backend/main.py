from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncpg

app = FastAPI()

# CORS: 讓前端連得上後端
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# DB basic setting
@app.on_event("startup")
async def startup():
    app.state.db_pool = await asyncpg.create_pool(
        user="postgres",
        password="password",
        database="focusmate",
        host="db",
        port=5432,
        min_size=1,
        max_size=10
    )

    # init db, create table
    async with app.state.db_pool.acquire() as conn:
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS items (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                done BOOLEAN DEFAULT FALSE
            );
        """)

@app.on_event("shutdown")
async def shutdown():
    await app.state.db_pool.close()

async def get_conn():
    return app.state.db_pool.acquire()


# define routes
@app.get("/")
async def root():
    return {"message": "Backend is running!"}

# --- PostgreSQL 連線測試 ---
@app.get("/db-test")
async def db_test():
    try:
        async with app.state.db_pool.acquire() as conn:
            rows = await conn.fetch("SELECT 1;")
            return {"db": "connected", "result": rows}
    except Exception as e:
        return {"db": "failed", "error": str(e)}

@app.get("/items")
async def get_items():
    async with app.state.db_pool.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM items ORDER BY id")
        return [dict(row) for row in rows]

@app.post("/items")
async def create_item(item: dict):
    async with app.state.db_pool.acquire() as conn:
        row = await conn.fetchrow(
            "INSERT INTO items (title, done) VALUES ($1, $2) RETURNING *",
            item["title"],
            item["done"]
        )
        return dict(row)
