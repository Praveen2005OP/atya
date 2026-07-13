"""
Custom model fields for Atya.

EncryptedEmailField stores its value encrypted at rest (Fernet symmetric
encryption from the `cryptography` package). Reading/writing the field in
Python still behaves like a normal string - encryption/decryption happens
automatically when Django talks to the database - so if db.sqlite3 (or a
dump of it) is ever committed to GitHub or shared, the raw emails inside
it aren't readable without FIELD_ENCRYPTION_KEY.

FIELD_ENCRYPTION_KEY itself must stay OUT of git (kept in .env, which is
gitignored) - encrypting the column doesn't help if the key ships with it.
"""
from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings
from django.db import models


def _get_fernet():
    key = settings.FIELD_ENCRYPTION_KEY
    if not key:
        raise ValueError(
            "FIELD_ENCRYPTION_KEY is not set. Add it to your .env file - "
            "see the setup steps for how to generate one."
        )
    return Fernet(key.encode() if isinstance(key, str) else key)


class EncryptedEmailField(models.CharField):
    """A CharField whose value is encrypted before it touches the DB."""

    def __init__(self, *args, **kwargs):
        # Ciphertext is much longer than the original email, so the
        # column needs more room than a normal EmailField.
        kwargs.setdefault("max_length", 500)
        super().__init__(*args, **kwargs)

    def get_prep_value(self, value):
        # Called right before Django writes the value to the database.
        value = super().get_prep_value(value)
        if not value:
            return value
        return _get_fernet().encrypt(value.encode()).decode()

    def from_db_value(self, value, expression, connection):
        # Called right after Django reads the raw column value back out.
        if not value:
            return value
        try:
            return _get_fernet().decrypt(value.encode()).decode()
        except InvalidToken:
            # Value predates encryption being turned on (plaintext row) -
            # return it as-is instead of raising, so old data still shows.
            return value
