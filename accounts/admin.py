# Register your models here.
from django.contrib import admin
from . models import *

admin.site.register([
    PasswordReset,
    Profile
])