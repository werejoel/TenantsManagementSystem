from django.db import models
from django.contrib.auth.models import User

# Create your models here.
class PasswordReset(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    code = models.IntegerField(blank=True, null=True)
    link = models.CharField(max_length=300, default="")

    def __str__(self):
        return str(self.user)

class Profile(models.Model):
    ROLE_CHOICES = [
        ('manager', 'Manager/Owner'),
        ('tenant', 'Tenant'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='tenant')

    def __str__(self):
        return f"{self.user.username} - {self.role}"
from django.db import models
from django.contrib.auth.models import User

# Create your models here.
class PasswordReset(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    code = models.IntegerField(blank=True, null=True)
    link = models.CharField(max_length=300, default="")

    def __str__(self):
        return str(self.user)