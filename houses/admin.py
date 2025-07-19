from django.contrib import admin
from .models import House

@admin.register(House)
class HouseAdmin(admin.ModelAdmin):
    list_display = ('model', 'price', 'location', 'is_occupied')
    list_filter = ('model', 'is_occupied')
    search_fields = ('location',)

# Register your models here.
