from django.contrib import admin
from .models import Tenant, House, Payment
from django.urls import reverse
from django.utils.html import format_html

@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ('name', 'phone', 'email', 'national_id', 'house')
    search_fields = ('name', 'email', 'national_id')
    
    def dashboard_link(self, obj):
        url = reverse('dashboard')
        return format_html('<a href="{}" target="_blank">View Dashboard</a>', url)

    dashboard_link.short_description = "Dashboard"


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('tenant', 'amount_paid', 'balance_due', 'overpayment', 'payment_date')
    list_filter = ('payment_date',)
    search_fields = ('tenant__name', 'house_name') 
    
       # Ensure the house dropdown is populated
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "house":
            kwargs["queryset"] = House.objects.all()
        return super().formfield_for_foreignkey(db_field, request, **kwargs)



     # Ensure the house dropdown is populated
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "house":
            kwargs["queryset"] = House.objects.all()
        return super().formfield_for_foreignkey(db_field, request, **kwargs)
    

    






# Register your models here.
