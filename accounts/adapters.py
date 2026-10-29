from allauth.socialaccount.adapter import DefaultSocialAccountAdapter


class SocialAccountAdapter(DefaultSocialAccountAdapter):
    def populate_user(self, request, sociallogin, data):
        user = super().populate_user(request, sociallogin, data)
        # Header / reviews show first_name; fall back to the email's name part.
        if not user.first_name and user.email:
            user.first_name = user.email.split("@")[0][:150]
        return user
