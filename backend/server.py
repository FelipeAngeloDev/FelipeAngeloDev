from fastapi import FastAPI, APIRouter, Request, Response, HTTPException, Depends, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import httpx
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone, timedelta

from courses_data import COURSES
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]
EMERGENT_LLM_KEY = os.environ['EMERGENT_LLM_KEY']

app = FastAPI()
api_router = APIRouter(prefix="/api")


# ============== MODELS ==============
class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: datetime


class SessionExchangeRequest(BaseModel):
    session_id: str


class CompleteLessonRequest(BaseModel):
    course_slug: str
    lesson_id: str


class ChatRequest(BaseModel):
    message: str
    model: str = "claude"  # "claude" or "gpt"
    session_id: Optional[str] = None


# ============== AUTH HELPERS ==============
async def get_current_user(
    request: Request,
    authorization: Optional[str] = Header(None),
) -> Optional[User]:
    token = request.cookies.get("session_token")
    if not token and authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "").strip()
    if not token:
        return None

    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        return None

    expires_at = session["expires_at"]
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        return None

    user_doc = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user_doc:
        return None
    return User(**user_doc)


async def require_user(request: Request, authorization: Optional[str] = Header(None)) -> User:
    user = await get_current_user(request, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Não autenticado")
    return user


# ============== AUTH ROUTES ==============
@api_router.post("/auth/session")
async def auth_session(payload: SessionExchangeRequest, response: Response):
    async with httpx.AsyncClient() as http:
        r = await http.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": payload.session_id},
            timeout=15,
        )
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Falha na autenticação")
    data = r.json()
    email = data["email"]
    session_token = data["session_token"]

    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "name": data.get("name", email),
            "picture": data.get("picture"),
            "created_at": datetime.now(timezone.utc),
        })
        # initialize progress doc
        await db.user_progress.insert_one({
            "user_id": user_id,
            "completed": [],
            "xp": 0,
            "streak": 0,
            "last_activity": None,
        })

    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc),
    })

    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60,
    )

    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return {"user": user_doc, "session_token": session_token}


@api_router.get("/auth/me")
async def auth_me(user: User = Depends(require_user)):
    return user


@api_router.post("/auth/logout")
async def auth_logout(request: Request, response: Response, authorization: Optional[str] = Header(None)):
    token = request.cookies.get("session_token")
    if not token and authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "").strip()
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie("session_token", path="/")
    return {"ok": True}


# ============== COURSES ==============
@api_router.get("/courses")
async def list_courses():
    """Returns courses summary (no full lesson content)."""
    return [
        {
            "slug": c["slug"],
            "title": c["title"],
            "subtitle": c["subtitle"],
            "description": c["description"],
            "icon": c["icon"],
            "color": c["color"],
            "level": c["level"],
            "lesson_count": len(c["lessons"]),
        }
        for c in COURSES
    ]


@api_router.get("/courses/{slug}")
async def get_course(slug: str):
    course = next((c for c in COURSES if c["slug"] == slug), None)
    if not course:
        raise HTTPException(status_code=404, detail="Curso não encontrado")
    return {
        "slug": course["slug"],
        "title": course["title"],
        "subtitle": course["subtitle"],
        "description": course["description"],
        "icon": course["icon"],
        "color": course["color"],
        "level": course["level"],
        "lessons": [
            {"id": l["id"], "title": l["title"]} for l in course["lessons"]
        ],
    }


@api_router.get("/courses/{slug}/lessons/{lesson_id}")
async def get_lesson(slug: str, lesson_id: str):
    course = next((c for c in COURSES if c["slug"] == slug), None)
    if not course:
        raise HTTPException(status_code=404, detail="Curso não encontrado")
    lesson = next((l for l in course["lessons"] if l["id"] == lesson_id), None)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lição não encontrada")
    return {
        "course": {"slug": course["slug"], "title": course["title"], "color": course["color"]},
        "lesson": lesson,
    }


# ============== PROGRESS ==============
@api_router.get("/progress")
async def get_progress(user: User = Depends(require_user)):
    progress = await db.user_progress.find_one({"user_id": user.user_id}, {"_id": 0})
    if not progress:
        progress = {"user_id": user.user_id, "completed": [], "xp": 0, "streak": 0, "last_activity": None}
        await db.user_progress.insert_one({**progress, "last_activity": None})
    last = progress.get("last_activity")
    if isinstance(last, datetime):
        progress["last_activity"] = last.isoformat()
    return progress


@api_router.post("/progress/complete")
async def complete_lesson(payload: CompleteLessonRequest, user: User = Depends(require_user)):
    key = f"{payload.course_slug}:{payload.lesson_id}"
    progress = await db.user_progress.find_one({"user_id": user.user_id}, {"_id": 0})
    if not progress:
        progress = {"user_id": user.user_id, "completed": [], "xp": 0, "streak": 0, "last_activity": None}
        await db.user_progress.insert_one(progress.copy())

    completed = set(progress.get("completed", []))
    xp_gained = 0
    if key not in completed:
        completed.add(key)
        xp_gained = 20

    # Streak logic
    now = datetime.now(timezone.utc)
    last = progress.get("last_activity")
    streak = progress.get("streak", 0) or 0
    if last:
        if last.tzinfo is None:
            last = last.replace(tzinfo=timezone.utc)
        days_diff = (now.date() - last.date()).days
        if days_diff == 0:
            pass  # same day
        elif days_diff == 1:
            streak += 1
        else:
            streak = 1
    else:
        streak = 1

    new_xp = (progress.get("xp", 0) or 0) + xp_gained

    await db.user_progress.update_one(
        {"user_id": user.user_id},
        {"$set": {
            "completed": list(completed),
            "xp": new_xp,
            "streak": streak,
            "last_activity": now,
        }},
    )
    return {"xp": new_xp, "streak": streak, "completed_count": len(completed), "xp_gained": xp_gained}


# ============== AI TUTOR ==============
SYSTEM_PROMPT = (
    "Você é um tutor de programação amigável e didático que responde SEMPRE em português brasileiro. "
    "Explique conceitos de forma simples, com exemplos de código curtos e claros. "
    "Use markdown e blocos de código com linguagem (ex.: ```python). "
    "Seja motivador e encorajador, ideal para iniciantes."
)


@api_router.post("/tutor/chat")
async def tutor_chat(payload: ChatRequest, user: User = Depends(require_user)):
    session_id = payload.session_id or f"{user.user_id}_{uuid.uuid4().hex[:8]}"

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=SYSTEM_PROMPT,
    )
    if payload.model == "gpt":
        chat.with_model("openai", "gpt-5.2")
    else:
        chat.with_model("anthropic", "claude-sonnet-4-5-20250929")

    # Persist user message
    await db.ai_chat_messages.insert_one({
        "user_id": user.user_id,
        "session_id": session_id,
        "role": "user",
        "content": payload.message,
        "model": payload.model,
        "created_at": datetime.now(timezone.utc),
    })

    try:
        reply = await chat.send_message(UserMessage(text=payload.message))
    except Exception as e:
        logger.exception("Tutor error")
        raise HTTPException(status_code=500, detail=f"Erro do tutor: {e}")

    await db.ai_chat_messages.insert_one({
        "user_id": user.user_id,
        "session_id": session_id,
        "role": "assistant",
        "content": reply,
        "model": payload.model,
        "created_at": datetime.now(timezone.utc),
    })

    return {"reply": reply, "session_id": session_id}


@api_router.get("/tutor/history")
async def tutor_history(user: User = Depends(require_user), session_id: Optional[str] = None):
    query = {"user_id": user.user_id}
    if session_id:
        query["session_id"] = session_id
    cursor = db.ai_chat_messages.find(query, {"_id": 0}).sort("created_at", 1).limit(200)
    msgs = await cursor.to_list(200)
    for m in msgs:
        if isinstance(m.get("created_at"), datetime):
            m["created_at"] = m["created_at"].isoformat()
    return msgs


@api_router.get("/")
async def root():
    return {"message": "API CodeMaster - Aprenda Programação"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
