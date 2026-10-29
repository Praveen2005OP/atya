from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend


class EmailOrUsernameBackend(ModelBackend):
    """Lets people log in with either their username or their email address."""

    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None or password is None:
            return None
        User = get_user_model()
        login = username.strip()
        field = "email__iexact" if "@" in login else "username__iexact"
        user = User.objects.filter(**{field: login}).order_by("id").first()
        if user is None:
            # Run the hasher anyway so a missing account takes as long as a
            # wrong password (doesn't reveal which emails are registered).
            User().set_password(password)
            return None
        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None
