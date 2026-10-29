"""
Simple attempt counters for login / signup / password reset, kept in
Django's cache (in-memory by default - Render runs one web process, so a
restart just clears the counters).
"""
import hashlib

from django.core.cache import cache

LOGIN_MAX_PER_ACCOUNT = 5     # wrong passwords for one email/username...
LOGIN_MAX_PER_IP = 20         # ...or from one IP...
LOGIN_WINDOW = 15 * 60        # ...within 15 minutes locks it for 15 minutes

PASSWORD_RESET_MAX_PER_IP = 5
SIGNUP_MAX_PER_IP = 10
HOURLY_WINDOW = 60 * 60


def client_ip(request):
    # Render's proxy appends the real client IP as the LAST X-Forwarded-For
    # entry (earlier entries can be set by the client, so they're not trusted).
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR", "")
    if forwarded:
        return forwarded.split(",")[-1].strip()
    return request.META.get("REMOTE_ADDR", "")


def _key(scope, value):
    digest = hashlib.sha256(value.strip().lower().encode()).hexdigest()[:32]
    return f"ratelimit:{scope}:{digest}"


def is_limited(scope, value, limit):
    return cache.get(_key(scope, value), 0) >= limit


def hit(scope, value, window):
    key = _key(scope, value)
    # add() only sets when missing, so the window starts at the first attempt.
    if not cache.add(key, 1, window):
        try:
            cache.incr(key)
        except ValueError:
            cache.set(key, 1, window)


def reset(scope, value):
    cache.delete(_key(scope, value))
