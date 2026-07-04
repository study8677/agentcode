# django/contrib/auth/tokens.py -- review context snapshot (excerpt).
# This is the code BEFORE the PR is applied.

from django.utils.crypto import constant_time_compare, salted_hmac
from django.utils.http import base36_to_int, int_to_base36


class PasswordResetTokenGenerator:
    key_salt = "django.contrib.auth.tokens.PasswordResetTokenGenerator"
    algorithm = None

    def make_token(self, user):
        return self._make_token_with_timestamp(
            user,
            self._num_seconds(self._now()),
            self.secret,
        )

    def check_token(self, user, token):
        if not (user and token):
            return False
        try:
            ts_b36, _ = token.split("-")
            ts = base36_to_int(ts_b36)
        except ValueError:
            return False

        for secret in [self.secret, *self.secret_fallbacks]:
            if constant_time_compare(
                self._make_token_with_timestamp(user, ts, secret),
                token,
            ):
                break
        else:
            return False

        return True

    def _make_token_with_timestamp(self, user, timestamp, secret):
        ts_b36 = int_to_base36(timestamp)
        hash_string = salted_hmac(
            self.key_salt,
            self._make_hash_value(user, timestamp),
            secret=secret,
            algorithm=self.algorithm,
        ).hexdigest()[::2]
        return "%s-%s" % (ts_b36, hash_string)

    def _make_hash_value(self, user, timestamp):
        """
        Hash the user's primary key, password, last login timestamp, and
        current timestamp. State included here is what invalidates old tokens.
        """
        login_timestamp = (
            "" if user.last_login is None
            else user.last_login.replace(microsecond=0, tzinfo=None)
        )
        return str(user.pk) + user.password + str(login_timestamp) + str(timestamp)
