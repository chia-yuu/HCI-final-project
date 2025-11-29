from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncpg

app = FastAPI()

# CORS：允許前端連後端用
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 建立資料庫連線（全域，避免每次重新連線）
async def get_db():
    return await asyncpg.connect(
        user="postgres",
        password="password",
        database="focusmate",
        host="db",
        port=5432
    )

async def init_db():
    # 建立 table
    conn = await get_db()
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS items (
            id SERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            done BOOLEAN DEFAULT FALSE
        );
    """)
    await conn.close()

# 在啟動時呼叫
@app.on_event("startup")
async def startup():
    await init_db()

@app.get("/")
async def root():
    return {"message": "Backend is running!"}


# --- PostgreSQL 連線測試用 ---
@app.get("/db-test")
async def db_test():
    try:
        conn = await asyncpg.connect(
            user="postgres",
            password="password",
            database="focusmate",
            host="db",  # docker-compose 裡的 service 名稱
            port=5432
        )
        rows = await conn.fetch("SELECT 1;")
        await conn.close()
        return {"db": "connected", "result": rows}
    except Exception as e:
        return {"db": "failed", "error": str(e)}

# --- Get /items ---
@app.get("/items")
async def get_items():
    conn = await get_db()
    rows = await conn.fetch("SELECT * FROM items ORDER BY id")
    await conn.close()

    # asyncpg 回傳 Record，不是 dict，需要轉換
    return [dict(row) for row in rows]

# --- Post /items ---
@app.post("/items")
async def create_item(item: dict):
    conn = await get_db()
    row = await conn.fetchrow(
        "INSERT INTO items (title, done) VALUES ($1, $2) RETURNING *",
        item["title"],
        item["done"]
    )
    await conn.close()
    return dict(row)