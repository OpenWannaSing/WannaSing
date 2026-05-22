"""Auth module: verification codes, email sending, JWT token handling."""

import os
import random
import smtplib
import logging
from email.mime.text import MIMEText
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from database import Base, get_db

logger = logging.getLogger(__name__)

# ── JWT config ─────────────────────────────────────────────────────────────
JWT_SECRET = os.environ.get("JWT_SECRET", "wanasing-dev-secret-change-in-prod")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 72

# ── Email config (SMTP) ────────────────────────────────────────────────────
SMTP_HOST = os.environ.get("SMTP_HOST", "")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASS = os.environ.get("SMTP_PASS", "")
SMTP_FROM = os.environ.get("SMTP_FROM", SMTP_USER)

security = HTTPBearer(auto_error=False)


# ── Database model ─────────────────────────────────────────────────────────
class VerificationCode(Base):
    __tablename__ = "verification_codes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(100), nullable=False, index=True)
    code = Column(String(6), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))


# ── Email sender ───────────────────────────────────────────────────────────
def _build_email_html(code: str, minutes: int = 5) -> str:
    """Build a nice HTML email body for the verification code."""
    return f"""\
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:'Segoe UI',Arial,sans-serif;">
  <table align="center" width="100%%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:40px auto;">
    <tr>
      <td style="background:linear-gradient(135deg,#667eea,#764ba2);padding:32px 24px;border-radius:16px 16px 0 0;text-align:center;">
        <h1 style="margin:0;color:#fff;font-size:24px;">WannaSing 🎤</h1>
      </td>
    </tr>
    <tr>
      <td style="background:#fff;padding:32px 24px;border-radius:0 0 16px 16px;box-shadow:0 4px 16px rgba(0,0,0,0.06);">
        <p style="margin:0 0 16px;color:#333;font-size:15px;">Hi there,</p>
        <p style="margin:0 0 24px;color:#555;font-size:15px;">
          Your verification code for WannaSing is:
        </p>
        <div style="background:#f8f9ff;border:2px dashed #667eea;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
          <span style="font-size:40px;font-weight:700;letter-spacing:8px;color:#667eea;font-family:monospace;">{code}</span>
        </div>
        <p style="margin:0 0 8px;color:#999;font-size:13px;">
          This code expires in <strong>{minutes} minutes</strong>.
          If you didn't request this, please ignore this email.
        </p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0 16px;">
        <p style="margin:0;color:#bbb;font-size:12px;">
          WannaSing — Sing your heart out.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>"""


def send_verification_email(email: str, code: str):
    """Send the 6-digit code via SMTP, or log to console in dev."""
    if SMTP_HOST and SMTP_USER and SMTP_PASS:
        html = _build_email_html(code)
        msg = MIMEText(html, "html", _charset="utf-8")
        msg["Subject"] = "Your WannaSing Verification Code"
        msg["From"] = SMTP_FROM
        msg["To"] = email

        # Try SSL (port 465) first, fallback to STARTTLS (port 587/25)
        for attempt_port in [465, 587, 25]:
            try:
                if attempt_port == 465:
                    with smtplib.SMTP_SSL(SMTP_HOST, attempt_port, timeout=10) as s:
                        s.login(SMTP_USER, SMTP_PASS)
                        s.send_message(msg)
                else:
                    with smtplib.SMTP(SMTP_HOST, attempt_port, timeout=10) as s:
                        s.starttls()
                        s.login(SMTP_USER, SMTP_PASS)
                        s.send_message(msg)
                logger.info("Email sent to %s via port %s", email, attempt_port)
                return
            except Exception as e:
                logger.warning("SMTP port %s failed: %s", attempt_port, e)
                continue

        logger.warning("All SMTP attempts failed, falling back to console log")
    else:
        logger.info("=== DEV MODE === Verification code for %s: %s", email, code)
    # Always print to stdout so it's visible in any terminal setup
    print(f"\n🔑 VERIFICATION CODE for {email}: {code}\n", flush=True)


# ── JWT helpers ────────────────────────────────────────────────────────────
def create_access_token(data: dict) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRE_HOURS)
    payload = {**data, "exp": expire}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])


# ── FastAPI dependency ─────────────────────────────────────────────────────
async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: AsyncSession = Depends(get_db),
):
    """Validate Bearer token and return the User object."""
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        payload = decode_access_token(credentials.credentials)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user_id: int | None = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    from models import User  # avoid circular import

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user
