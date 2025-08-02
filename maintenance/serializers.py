from rest_framework import serializers
from .models import MaintenanceRequest

class MaintenanceRequestSerializer(serializers.ModelSerializer):
    tenant_username = serializers.CharField(source='tenant.username', read_only=True)

    class Meta:
        model = MaintenanceRequest
        fields = ['id', 'tenant', 'tenant_username', 'description', 'status', 'notes', 'created_at', 'updated_at']
        read_only_fields = ['id', 'tenant', 'created_at', 'updated_at', 'tenant_username']
