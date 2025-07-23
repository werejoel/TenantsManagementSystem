from django.core.management.base import BaseCommand
from django.contrib.auth.models import User

class Command(BaseCommand):
    help = 'Check and print the status (is_active) of all users.'

    def handle(self, *args, **kwargs):
        users = User.objects.all()
        if not users:
            self.stdout.write(self.style.WARNING('No users found.'))
            return
        for user in users:
            status = 'ACTIVE' if user.is_active else 'INACTIVE'
            self.stdout.write(f'User: {user.username} | Email: {user.email} | Status: {status}')
