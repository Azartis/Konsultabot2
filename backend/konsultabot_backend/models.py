"""
This module previously contained a duplicate `User` model definition.

The canonical custom user model lives in the `user_account` app
(`backend/user_account/models.py`). Keeping two `User` model classes
causes Django import/runtime errors because Django can't determine
the app_label for duplicate model definitions.

To avoid that conflict the model definition was removed from here.
If you intended to keep a different model in this app, define it with
an explicit `app_label` in the model Meta or register the app in
`INSTALLED_APPS` with a unique label.

See: `backend/user_account/models.py` for the active User model.
"""

# Intentionally empty module after removing duplicate User model
