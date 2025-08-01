from django.db.models.signals import post_delete
from django.dispatch import receiver
from django.apps import apps

@receiver(post_delete, sender=apps.get_model('tenants', 'Tenant'))  
def update_house_status(sender, instance, **kwargs):
    House = apps.get_model('tenants', 'House')
    if instance.house:
        instance.house.is_occupied = False
        instance.house.save()