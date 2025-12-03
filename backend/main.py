from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncpg
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Optional

app = FastAPI()

# CORS: 讓前端連得上後端
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === 資料模型 (Models) ===

class FocusSession(BaseModel):
    duration_seconds: int
    note: str = ""
    user_id: int = 1  # 預設 User ID

class UserStatus(BaseModel):
    user_id: int = 1
    is_studying: bool

class DeadlineItem(BaseModel):
    user_id: int = 1
    deadline_date: str
    task: str
    is_done: bool = False
    display_order: int = 1

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


# === API Routes ===

@app.get("/")
async def root():
    return {"message": "Backend is running!"}

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

# === focus mode的功能(by sandra) ===

# 取得 Deadlines (放在下面的list)
# api.get('/deadlines') 
@app.get("/deadlines")
async def get_deadlines():
    async with app.state.db_pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT id, task as thing, is_done, deadline_date 
            FROM deadlines 
            ORDER BY deadline_date ASC
        """)
        return [dict(row) for row in rows]

# 修改 is_studying
# 開始 & 結束時修改
@app.post("/user/status")
async def update_status(status: UserStatus):
    async with app.state.db_pool.acquire() as conn:
        await conn.execute(
            "UPDATE users SET is_studying = $1 WHERE user_id = $2",
            status.is_studying, status.user_id
        )
    return {"status": "updated", "is_studying": status.is_studying}

# 專注結束的時間存檔

@app.post("/focus/save")
async def save_focus_session(session: FocusSession):
    async with app.state.db_pool.acquire() as conn:
        
        # 計算時間與徽章
        minutes = session.duration_seconds // 60
        earned_badge = False
        if minutes >= 60:
            earned_badge = True

        # 拿到徽章，加到badge
        if earned_badge:
            await conn.execute("UPDATE users SET badge = badge + 1 WHERE user_id = $1", session.user_id)

        # 寫入 focus_time (每小時統計)
        end_time = datetime.now()
        start_time = end_time - timedelta(seconds=session.duration_seconds)
        current_cursor = start_time
        
        while current_cursor < end_time:
            next_hour = (current_cursor + timedelta(hours=1)).replace(minute=0, second=0, microsecond=0)
            segment_end = min(next_hour, end_time)
            segment_duration = (segment_end - current_cursor).total_seconds() / 60
            segment_minutes = int(segment_duration)
            
            if segment_minutes > 0:
                r_date = current_cursor.date()
                r_hour = current_cursor.hour
                
                await conn.execute("""
                    INSERT INTO focus_time (user_id, record_date, record_hour, focus_minutes)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT (user_id, record_date, record_hour)
                    DO UPDATE SET focus_minutes = focus_time.focus_minutes + EXCLUDED.focus_minutes
                """, session.user_id, r_date, r_hour, segment_minutes)
            
            current_cursor = segment_end

        return {
            "status": "success", 
            "minutes": minutes, 
            "badge_earned": earned_badge
        }

