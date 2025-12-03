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

    # create table
    async with app.state.db_pool.acquire() as conn:
        # items
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS items (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                done BOOLEAN DEFAULT FALSE
            );
        """)

        # users
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                user_id SERIAL PRIMARY KEY,
                name TEXT not NULL,
                is_studying BOOLEAN,
                title TEXT,
                badge INTEGER
            );
        """)
        
        # friends
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS friends (
                user_id   INTEGER NOT NULL,
                friend_id INTEGER NOT NULL,

                PRIMARY KEY (user_id, friend_id),

                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
                FOREIGN KEY (friend_id) REFERENCES users(user_id) ON DELETE CASCADE
            );
        """)

        # deadlines
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS deadlines (
                id        SERIAL PRIMARY KEY,
                user_id   INTEGER NOT NULL,
                deadline_date   DATE,
                task      TEXT,
                is_done   BOOLEAN,
                display_order INTEGER,
                
                UNIQUE (user_id, display_order),
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
            );
        """)

        # focus_time
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS focus_time (
                user_id       INTEGER NOT NULL,
                record_date   DATE NOT NULL,
                record_hour   INT NOT NULL CHECK (record_hour BETWEEN 0 AND 23),
                focus_minutes INT DEFAULT 0 CHECK (focus_minutes BETWEEN 0 AND 60),

                UNIQUE (user_id, record_date, record_hour),
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
            );
        """)

        # picture
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS pictures (
                id      SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                img     BYTEA,

                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
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
