import base64
import hashlib
import hmac
import json
import os
import secrets
import sqlite3
import time
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException

from backend.database import (
    DEFAULT_DB_PATH,
    create_user,
    get_user_by_email,
    get_user_by_id,
    update_user,
)
from backend.schemas import AuthResponse, LoginInput, ProfileUpdateInput, RegisterInput, UserOut

PBKDF2_ITERATIONS = 600_000
TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60
SECRET_FILE = os.path.join(os.path.dirname(DEFAULT_DB_PATH), ".session_secret")

router = APIRouter(prefix="/auth", tags=["auth"])

def _secret_key() -> bytes:
    """
    Signing key for session tokens: PROCROP_SECRET_KEY, otherwise a key
    generated once and kept next to the database.
    """
    env_key = os.environ.get("PROCROP_SECRET_KEY")
    if env_key:
        return env_key.encode("utf-8")
    if os.path.isfile(SECRET_FILE):
        with open(SECRET_FILE, "r", encoding="utf-8") as f:
            stored = f.read().strip()
        if stored:
            return stored.encode("utf-8")
    generated = secrets.token_hex(32)
    with open(SECRET_FILE, "w", encoding="utf-8") as f:
        f.write(generated)
    return generated.encode("utf-8")

def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PBKDF2_ITERATIONS)
    return f"pbkdf2_sha256${PBKDF2_ITERATIONS}${salt.hex()}${digest.hex()}"

def verify_password(password: str, stored_hash: str) -> bool:
    try:
        algorithm, iterations, salt_hex, digest_hex = stored_hash.split("$")
        if algorithm != "pbkdf2_sha256":
            return False
        digest = hashlib.pbkdf2_hmac(
            "sha256", password.encode("utf-8"), bytes.fromhex(salt_hex), int(iterations)
        )
        return hmac.compare_digest(digest, bytes.fromhex(digest_hex))
    except (ValueError, TypeError):
        return False

def _b64encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")

def _b64decode(text: str) -> bytes:
    return base64.urlsafe_b64decode(text + "=" * (-len(text) % 4))

def create_token(user_id: int) -> str:
    payload = _b64encode(json.dumps({"uid": user_id, "exp": int(time.time()) + TOKEN_TTL_SECONDS}).encode("utf-8"))
    signature = hmac.new(_secret_key(), payload.encode("ascii"), hashlib.sha256).digest()
    return f"{payload}.{_b64encode(signature)}"

def read_token(token: str) -> Optional[int]:
    """Returns the user id of a valid, unexpired token, otherwise None."""
    try:
        payload, signature = token.split(".")
        expected = hmac.new(_secret_key(), payload.encode("ascii"), hashlib.sha256).digest()
        if not hmac.compare_digest(expected, _b64decode(signature)):
            return None
        data = json.loads(_b64decode(payload))
        if int(data["exp"]) < time.time():
            return None
        return int(data["uid"])
    except (ValueError, KeyError, TypeError):
        return None

def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    """FastAPI dependency: resolves the bearer token to a row in the users table."""
    scheme, _, token = (authorization or "").partition(" ")
    user_id = read_token(token.strip()) if scheme.lower() == "bearer" else None
    user = get_user_by_id(user_id) if user_id is not None else None
    if user is None:
        raise HTTPException(status_code=401, detail="Sign in to continue.")
    return user

def _auth_response(user: dict) -> AuthResponse:
    return AuthResponse(token=create_token(user["id"]), user=UserOut(**user))

@router.post("/register", response_model=AuthResponse, status_code=201)
def register(data: RegisterInput):
    """Creates an account in the users table and signs the user in."""
    try:
        user = create_user(data.name, data.email, hash_password(data.password))
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")
    return _auth_response(user)

@router.post("/login", response_model=AuthResponse)
def login(data: LoginInput):
    """Checks the email and password against the users table."""
    user = get_user_by_email(data.email)
    if user is None or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    return _auth_response(user)

@router.get("/me", response_model=UserOut)
def read_profile(user: dict = Depends(get_current_user)):
    return UserOut(**user)

@router.put("/me", response_model=UserOut)
def update_profile(data: ProfileUpdateInput, user: dict = Depends(get_current_user)):
    """Updates the signed-in user's name and email in the users table."""
    try:
        updated = update_user(user["id"], data.name, data.email)
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")
    if updated is None:
        raise HTTPException(status_code=401, detail="Sign in to continue.")
    return UserOut(**updated)
