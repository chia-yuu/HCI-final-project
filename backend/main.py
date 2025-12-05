from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncpg
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Optional, List

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
    id: int = 1
    user_id: int = 1
    deadline_date: str = '2020-01-01'
    task: str = 'task name'
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
                
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
            );
        """)

        await conn.execute("""
            ALTER TABLE IF EXISTS public.deadlines
            DROP CONSTRAINT IF EXISTS deadlines_user_id_display_order_key;
        """)

        # focus_time
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS focus_time (
                user_id       INTEGER NOT NULL,
                record_date   DATE NOT NULL,
                record_hour   INT NOT NULL CHECK (record_hour BETWEEN 0 AND 23),
                focus_minutes INT DEFAULT 0 CHECK (focus_minutes BETWEEN 0 AND 60),

                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
            );
        """)

        await conn.execute("""
            ALTER TABLE IF EXISTS public.focus_time
            DROP CONSTRAINT IF EXISTS focus_time_user_id_record_date_record_hour_key;
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
            SELECT id, task as thing, is_done, display_order 
            FROM deadlines 
            ORDER BY display_order ASC
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


# === deadline list ===
@app.get("/deadlines/get-deadlines")
async def get_deadlines():
    async with app.state.db_pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT id, display_order, is_done
            FROM deadlines
            WHERE user_id = 1
            ORDER BY display_order ASC
        """)

        # calculate the correct display_order
        # is done -> order = -1, not done -> order = 1 ... n
        undone = [row for row in rows if row["is_done"] is False]
        done = [row for row in rows if row["is_done"] is True]

        correct_orders = {}
        for i, row in enumerate(undone):
            correct_orders[row["id"]] = i + 1
        for row in done:
            correct_orders[row["id"]] = -1

        # update display_order in db
        updates = []
        for row in undone:
            correct = correct_orders[row["id"]]
            if row["display_order"] != correct:
                updates.append((correct, row["id"]))
        for row in done:
            if row["display_order"] != -1:
                updates.append((-1, row["id"]))

        if updates:
            async with conn.transaction():
                for new_order, id_ in updates:
                    await conn.execute("""
                        UPDATE deadlines
                        SET display_order = $1
                        WHERE id = $2
                    """, new_order, id_)

        rows = await conn.fetch("""
            SELECT id, user_id, deadline_date, task as thing, is_done, display_order
            FROM deadlines
            WHERE user_id = 1
            ORDER BY is_done ASC, display_order ASC
        """)

        return [dict(row) for row in rows]


@app.post("/deadlines/reorder")
async def reorder_deadlines(items: List[DeadlineItem]):
    async with app.state.db_pool.acquire() as conn:
        async with conn.transaction():
            for item in items:
                await conn.execute("""
                    UPDATE deadlines
                    SET display_order = $1
                    WHERE id = $2 AND user_id = $3
                """, item.display_order, item.id, 1)

    return {"status": "success", "updated": len(items)}

@app.post("/deadlines/click-done")
async def deadline_done(item: DeadlineItem):
    async with app.state.db_pool.acquire() as conn:
        async with conn.transaction():
            await conn.execute("""
                UPDATE deadlines
                SET is_done = $1, display_order = -1
                WHERE id = $2
            """, item.is_done, item.id)

    return {"status": "success", "updated": 1}

@app.post("/deadlines/add-item")
async def add_deadline(item: DeadlineItem):
    async with app.state.db_pool.acquire() as conn:
        async with conn.transaction():
            # get new display_order
            row = await conn.fetchrow("""
                SELECT COALESCE(MAX(display_order), 0) AS max_order
                FROM deadlines
                WHERE user_id = 1
            """)

            next_order = row["max_order"] + 1

            deadline_date = datetime.strptime(item.deadline_date, "%Y-%m-%d").date()

            # add item
            await conn.execute("""
                INSERT INTO deadlines (user_id, deadline_date, task, is_done, display_order)
                VALUES ($1, $2, $3, $4, $5)
            """, 
            1, deadline_date, item.task, item.is_done, next_order)

    return {"status": "success", "update": 1}

@app.post("/deadlines/edit-item")
async def edit_deadline(item: DeadlineItem):
    async with app.state.db_pool.acquire() as conn:
        async with conn.transaction():
            deadline_date = datetime.strptime(item.deadline_date, "%Y-%m-%d").date()
            await conn.execute("""
                UPDATE deadlines
                SET task = $1, deadline_date = $2
                WHERE id = $3
            """, 
            item.task, deadline_date, item.id)

    return {"status": "success", "update": 1}

@app.post("/deadlines/remove-item")
async def remove_deadline(item: DeadlineItem):
    async with app.state.db_pool.acquire() as conn:
        async with conn.transaction():
            await conn.execute("""
                DELETE FROM deadlines WHERE id = $1;
            """, 
            item.id)

    return {"status": "success", "update": 1}