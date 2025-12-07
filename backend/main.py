from fastapi import FastAPI, Query, HTTPException
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

# 💡 新增：好友狀態回應模型，用於 /api/v1/friends/status
class FriendStatusResponse(BaseModel):
    friend_id: int
    name: str
    is_studying: bool
    current_timer: Optional[str] = None

class PictureUpload(BaseModel):
    user_id: int = 1         # 圖片所屬的使用者 ID (從前端 UserContext 傳入)
    image_data: str          # Base64 編碼的圖片字串
    description: Optional[str] = None


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

                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
                PRIMARY KEY (user_id, record_date, record_hour)
            );
        """)
        # 註: 我在這裡將 PRIMARY KEY 加入到 focus_time 表格，以便 ON CONFLICT 生效

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

        # 💡 [新增] 確保 User 1 和 User 2 存在 (解決 ForeignKeyViolationError)
        await conn.execute("""
        INSERT INTO users (user_id, name, is_studying, title, badge)
        VALUES (1, 'User 1', FALSE, 'Beginner', 0)
        ON CONFLICT (user_id) DO NOTHING;
        """)
        await conn.execute("""
            INSERT INTO users (user_id, name, is_studying, title, badge)
            VALUES (2, 'User 2', FALSE, 'Beginner', 0)
            ON CONFLICT (user_id) DO NOTHING;
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

# 💡 新增：處理 /api/v1/friends/status 的路由
@app.get("/api/v1/friends/status", response_model=List[FriendStatusResponse])
async def get_friends_status(ids: str = Query(..., description="好友 User ID 列表，以逗號分隔, e.g., 1,2,3")):
    """
    獲取指定 ID 列表的好友專注狀態。
    """
    try:
        # 將逗號分隔的字串轉換為整數列表
        friend_ids = [int(i.strip()) for i in ids.split(',') if i.strip().isdigit()]
    except ValueError:
        raise HTTPException(status_code=400, detail="IDs 參數必須是逗號分隔的數字列表。")
    
    if not friend_ids:
        return []

    # 將 ID 列表轉換為 PostgreSQL 查詢參數
    id_tuple = tuple(friend_ids)

    async with app.state.db_pool.acquire() as conn:
        # 查詢 users 表格獲取 user_id 和 is_studying 狀態
        rows = await conn.fetch("""
            SELECT 
                user_id, 
                name,
                is_studying,
                badge -- 額外獲取 badge 欄位
            FROM users 
            WHERE user_id = ANY($1::int[])
        """, id_tuple)
        
        results: List[FriendStatusResponse] = []
        
        for row in rows:
            timer = None
            if row["is_studying"] is True and row["user_id"] == 3:
                # 假設 ID=3 的人正在專注且有計時器顯示
                timer = "01:30:00"

            results.append(FriendStatusResponse(
                friend_id=row["user_id"],
                name=row["name"],
                is_studying=row["is_studying"] if row["is_studying"] is not None else False,
                current_timer=timer
            ))
            
        return results

# === focus mode的功能(by sandra) ===

# 取得 Deadlines (放在下面的list)
# api.get('/deadlines') 
# @app.get("/deadlines")
# async def get_deadlines():
#     async with app.state.db_pool.acquire() as conn:
#         rows = await conn.fetch("""
#             SELECT id, task as thing, is_done, display_order 
#             FROM deadlines 
#             ORDER BY display_order ASC
#         """, user_id)
#         return [dict(row) for row in rows]
@app.get("/deadlines")
async def get_deadlines(user_id: int = Query(..., description="要查詢的使用者 ID")): # 💡 修正 1: 接收 user_id
    async with app.state.db_pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT id, task as thing, is_done, display_order 
            FROM deadlines 
            WHERE user_id = $1 
            ORDER BY display_order ASC
        """, user_id) # 💡 修正 3: 傳遞 user_id 給 SQL
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
            await conn.execute("UPDATE users SET badge = COALESCE(badge, 0) + 1 WHERE user_id = $1", session.user_id)

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
async def get_deadlines_with_reorder(user_id: int = Query(..., description="要查詢的使用者 ID")): 
    async with app.state.db_pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT id, display_order, is_done
            FROM deadlines
            WHERE user_id = $1 
            ORDER BY display_order ASC
        """, user_id) 



        # calculate the correct display_order
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
                        WHERE id = $2 AND user_id = $3
                    """, new_order, id_, user_id) 


        rows = await conn.fetch("""
            SELECT id, user_id, deadline_date, task as thing, is_done, display_order
            FROM deadlines
            WHERE user_id = $1
            ORDER BY is_done ASC, display_order ASC
        """, user_id)

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
                """, item.display_order, item.id, item.user_id)

    return {"status": "success", "updated": len(items)}

@app.post("/deadlines/click-done")
async def deadline_done(item: DeadlineItem):
    async with app.state.db_pool.acquire() as conn:
        async with conn.transaction():
            await conn.execute("""
                UPDATE deadlines
                SET is_done = $1, display_order = -1
                WHERE id = $2 AND user_id = $3 
            """, item.is_done, item.id, item.user_id) 

    return {"status": "success", "updated": 1}

@app.post("/deadlines/add-item")
async def add_deadline(item: DeadlineItem):
    async with app.state.db_pool.acquire() as conn:
        async with conn.transaction():
            # get new display_order
            # row = await conn.fetchrow("""
            #     SELECT COALESCE(MAX(display_order), 0) AS max_order
            #     FROM deadlines
            #     WHERE user_id = 1
            # """)
            # 1. 查詢最大排序號碼 (必須針對該使用者)
            row = await conn.fetchrow("""
                SELECT COALESCE(MAX(display_order), 0) AS max_order
                FROM deadlines
                WHERE user_id = $1 
            """, item.user_id) 

            next_order = row["max_order"] + 1

            deadline_date = datetime.strptime(item.deadline_date, "%Y-%m-%d").date()

            # add item
            await conn.execute("""
                INSERT INTO deadlines (user_id, deadline_date, task, is_done, display_order)
                VALUES ($1, $2, $3, $4, $5)
            """, 
            item.user_id, deadline_date, item.task, item.is_done, next_order)

    return {"status": "success", "update": 1}

@app.post("/deadlines/edit-item")
async def edit_deadline(item: DeadlineItem):
    async with app.state.db_pool.acquire() as conn:
        async with conn.transaction():
            deadline_date = datetime.strptime(item.deadline_date, "%Y-%m-%d").date()
            await conn.execute("""
                UPDATE deadlines
                SET task = $1, deadline_date = $2
                WHERE id = $3 AND user_id = $4
            """, 
            item.task, deadline_date, item.id, item.user_id)

    return {"status": "success", "update": 1}

@app.post("/deadlines/remove-item")
async def remove_deadline(item: DeadlineItem):
    async with app.state.db_pool.acquire() as conn:
        async with conn.transaction():
            await conn.execute("""
                DELETE FROM deadlines WHERE id = $1 AND user_id = $2;
            """, 
            item.id, item.user_id) 

    return {"status": "success", "update": 1}

# === 圖片上傳 API (Camera Functionality) ===

@app.post("/pictures/upload")
async def upload_picture(picture: PictureUpload):
    """
    接收 Base64 編碼的圖片字串，並將其以 BYTEA 格式存入資料庫。
    """
    import base64
    
    if not picture.image_data:
        raise HTTPException(status_code=400, detail="圖片數據不能為空")
    
    try:
        # 處理並移除 Base64 字串可能有的前綴 (如: 'data:image/jpeg;base64,')
        if ";" in picture.image_data:
            _, encoded_data = picture.image_data.split(",", 1)
        else:
            encoded_data = picture.image_data
            
        # 將 Base64 解碼為二進位數據 (bytes)
        image_bytes = base64.b64decode(encoded_data)
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"圖片解碼失敗: {e}")

    async with app.state.db_pool.acquire() as conn:
        try:
            # 將二進位數據存入 BYTEA 欄位
            row = await conn.fetchrow(
                """
                INSERT INTO pictures (user_id, img)
                VALUES ($1, $2)
                RETURNING id
                """,
                picture.user_id, image_bytes
            )
            return {"status": "success", "picture_id": row["id"]}
        except Exception as e:
            # 捕獲資料庫錯誤，返回 500
            raise HTTPException(status_code=500, detail=f"資料庫儲存失敗: {e}")
            
# 💡 [新增] 獲取最新圖片 API (用於回顧頁面)
@app.get("/pictures/recent/{user_id}")
async def get_recent_picture(user_id: int):
    """
    獲取指定 ID 的最新圖片 (返回 Base64 編碼字串)。
    """
    import base64
    async with app.state.db_pool.acquire() as conn:
        # 假設 'id' 越大表示越新，獲取該 user_id 的最大 id 記錄
        row = await conn.fetchrow(
            "SELECT img FROM pictures WHERE user_id = $1 ORDER BY id DESC LIMIT 1",
            user_id
        )
        
        if not row or not row["img"]:
            # 如果找不到圖片，返回一個空字串或 404
            return {"image_data": None, "message": "No recent picture found."}
            
        # 將 BYTEA 數據重新編碼為 Base64 字串
        encoded_image = base64.b64encode(row["img"]).decode('utf-8')
        
        # 返回 Base64 URI 格式，方便前端 Image 元件直接使用
        return {"image_data": f"data:image/jpeg;base64,{encoded_image}"}
@app.get("/api/v1/user/record_status", response_model=UserRecordStatus)
async def get_user_record_status(user_id: int = Query(1)):
    """
    API 1: 獲取用戶的稱號和徽章計數 (寫死資料)。
    """
    # 寫死資料：用戶稱號和徽章數
    return UserRecordStatus(
        title_name="時光旅人 (來自 FastAPI)",
        badge_count=18
    )
