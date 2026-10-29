from django.conf import settings


def auth_options(request):
    return {"google_login_enabled": settings.GOOGLE_LOGIN_ENABLED}
