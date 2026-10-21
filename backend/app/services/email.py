import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings

logger = logging.getLogger(__name__)


def _send_smtp_message(msg: MIMEMultipart) -> None:
    """
    Connects to the SMTP server using SSL (SMTPS, port 465) or standard SMTP + STARTTLS (port 587/25).
    """
    use_ssl = getattr(settings, "SMTP_SSL", False) or settings.SMTP_PORT == 465
    if use_ssl:
        server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15)
    else:
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15)
        if getattr(settings, "SMTP_TLS", False):
            server.starttls()

    with server:
        if settings.SMTP_USER and settings.SMTP_PASSWORD:
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.send_message(msg)


def send_verification_email(
    to_email: str, username: str, verification_token: str
) -> bool:
    """
    Sends an email verification link to newly registered users.
    If SMTP credentials are not configured, logs the verification link to the console.
    """
    verification_url = (
        f"{settings.FRONTEND_URL}/verify-email?token={verification_token}"
    )

    subject = "Verify your SA Healthcare account"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }}
        .container {{ max-width: 580px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }}
        .header {{ background-color: #0d1b2a; padding: 28px; text-align: center; }}
        .header h1 {{ color: #ffffff; margin: 0; font-size: 22px; letter-spacing: 0.5px; }}
        .header .badge {{ color: #ffb703; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }}
        .body {{ padding: 32px 28px; color: #1e293b; line-height: 1.6; font-size: 14px; }}
        .button {{ display: inline-block; background-color: #ffb703; color: #0d1b2a !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: bold; font-size: 14px; margin: 20px 0; }}
        .footer {{ padding: 20px 28px; background-color: #f1f5f9; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }}
        .url-box {{ background-color: #f8fafc; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 12px; word-break: break-all; color: #475569; border: 1px solid #e2e8f0; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="badge">SA Healthcare</div>
          <h1>Confirm Your Email Address</h1>
        </div>
        <div class="body">
          <p>Hello <strong>{username}</strong>,</p>
          <p>Thank you for signing up for an account with SA Healthcare. Please click the button below to verify your email address and activate your account:</p>

          <div style="text-align: center;">
            <a href="{verification_url}" class="button">Verify My Email</a>
          </div>

          <p>Or paste this link into your browser:</p>
          <div class="url-box">{verification_url}</div>

          <p style="margin-top: 24px; color: #64748b; font-size: 12px;">This link will expire in 24 hours. If you did not create an account, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          &copy; SA Healthcare &bull; Healthcare Without Limits
        </div>
      </div>
    </body>
    </html>
    """

    plain_content = f"""Hello {username},

Thank you for registering with SA Healthcare.

Please verify your email address by visiting this link:
{verification_url}

This link is valid for 24 hours. If you did not register, please ignore this email.
"""

    # Always log the verification link for local development / testing
    logger.info(f"=== EMAIL VERIFICATION LINK FOR {to_email} ===")
    logger.info(f"{verification_url}")
    logger.info("===============================================")

    # If SMTP host is configured, send the real email
    if settings.SMTP_HOST:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
            msg["To"] = to_email

            msg.attach(MIMEText(plain_content, "plain"))
            msg.attach(MIMEText(html_content, "html"))

            _send_smtp_message(msg)

            logger.info(f"Verification email successfully dispatched to {to_email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email via SMTP to {to_email}: {e}")
            return False

    return True


def send_password_reset_email(to_email: str, username: str, reset_token: str) -> bool:
    """
    Sends a password reset link to user.
    If SMTP credentials are not configured, logs the reset link to the console.
    """
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
    subject = "Reset your SA Healthcare password"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }}
        .container {{ max-width: 580px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }}
        .header {{ background-color: #0d1b2a; padding: 28px; text-align: center; }}
        .header h1 {{ color: #ffffff; margin: 0; font-size: 22px; letter-spacing: 0.5px; }}
        .header .badge {{ color: #ffb703; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }}
        .body {{ padding: 32px 28px; color: #1e293b; line-height: 1.6; font-size: 14px; }}
        .button {{ display: inline-block; background-color: #0d1b2a; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: bold; font-size: 14px; margin: 20px 0; }}
        .footer {{ padding: 20px 28px; background-color: #f1f5f9; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }}
        .url-box {{ background-color: #f8fafc; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 12px; word-break: break-all; color: #475569; border: 1px solid #e2e8f0; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="badge">SA Healthcare</div>
          <h1>Password Reset Request</h1>
        </div>
        <div class="body">
          <p>Hello <strong>{username}</strong>,</p>
          <p>We received a request to reset your password for your SA Healthcare account. Click the button below to choose a new password:</p>

          <div style="text-align: center;">
            <a href="{reset_url}" class="button">Reset My Password</a>
          </div>

          <p>Or paste this link into your browser:</p>
          <div class="url-box">{reset_url}</div>

          <p style="margin-top: 24px; color: #64748b; font-size: 12px;">This link will expire in 30 minutes. If you did not request a password reset, you can safely ignore this email; your password will remain unchanged.</p>
        </div>
        <div class="footer">
          &copy; SA Healthcare &bull; Healthcare Without Limits
        </div>
      </div>
    </body>
    </html>
    """

    plain_content = f"""Hello {username},

We received a request to reset your password for your SA Healthcare account.

Please visit the link below to set a new password:
{reset_url}

This link is valid for 30 minutes. If you did not request this, please ignore this email.
"""

    logger.info(f"=== PASSWORD RESET LINK FOR {to_email} ===")
    logger.info(f"{reset_url}")
    logger.info("==========================================")

    if settings.SMTP_HOST:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
            msg["To"] = to_email

            msg.attach(MIMEText(plain_content, "plain"))
            msg.attach(MIMEText(html_content, "html"))

            _send_smtp_message(msg)

            logger.info(f"Password reset email successfully dispatched to {to_email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send password reset email to {to_email}: {e}")
            return False

    return True
