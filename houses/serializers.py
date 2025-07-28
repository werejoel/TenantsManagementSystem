from rest_framework import serializers
from .models import House

class HouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = House
        fields = '__all__'
        extra_kwargs = {
            'landlord': {'required': False, 'allow_null': True},
        }
