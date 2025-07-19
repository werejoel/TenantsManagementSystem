from django.apps import AppConfig


class TenantsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'tenants'

def ready(self):
    import tenants.signals  # This ensures that the signals are loaded when the app starts

