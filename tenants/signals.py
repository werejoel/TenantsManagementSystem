from django.db.models.signals import post_delete
from django.dispatch import receiver
from django.apps import apps  # Import apps to use lazy loading for models

@receiver(post_delete, sender=apps.get_model('tenants', 'Tenant'))  # Use lazy loading for the model
def update_house_status(sender, instance, **kwargs):
    House = apps.get_model('tenants', 'House')  # Lazy load the House model
    if instance.house:
        instance.house.is_occupied = False
        instance.house.save()