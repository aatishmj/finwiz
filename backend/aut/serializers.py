from rest_framework import serializers
from django.contrib.auth.models import User
from .models import *

class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["username", "email", "password"]


    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["email"],  # Use email as username
            email=validated_data["email"],
            password=validated_data["password"]
        )
        return user

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['balance']

class PortfolioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Portfolio
        fields = ['id', 'asset_name', 'quantity', 'value']

class WatchlistSerializer(serializers.ModelSerializer):
    class Meta:
        model = Watchlist
        fields = ['id', 'stock_symbol', 'added_on']

        
