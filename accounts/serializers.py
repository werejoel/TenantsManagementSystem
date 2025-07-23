from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Profile

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=Profile.ROLE_CHOICES)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'role')

    def create(self, validated_data):
        import logging
        role = validated_data.pop('role')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        user.is_active = True
        user.save()
        # The Profile will be created by the signal. Set the role if needed.
        if hasattr(user, 'profile'):
            user.profile.role = role
            user.profile.save()
        logging.warning(f"User {user.username} created with is_active={user.is_active}")
        return user



class UserSerialiser(serializers.ModelSerializer):
    class Meta:
        model = User
        #fields = "__all__"
        fields = ['id', 'username', 'first_name', 'last_name', 'email']
