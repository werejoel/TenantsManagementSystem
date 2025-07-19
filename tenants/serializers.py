from rest_framework import serializers
from .models import Tenant, Payment, House

class TenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = '__all__'

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'

class HouseSerializer(serializers.ModelSerializer):  # Add this class
    class Meta:
        model = House
        fields = '__all__'       
