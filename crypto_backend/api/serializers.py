from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import User, Coin, Bookmark
import re


class UserRegistrationSerializer(serializers.Serializer):
    """
    Serializer for user registration with custom validation
    """
    email = serializers.EmailField()
    name = serializers.CharField()
    password = serializers.CharField(write_only=True)
    
    def validate_email(self, value):
        """
        Validate email format and uniqueness
        """
        # Check if email already exists
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("既に登録されているメールアドレスです")
        return value
    
    def validate_password(self, value):
        """
        Validate password format: alphanumeric only, 4-20 characters
        """
        if not re.match(r'^[a-zA-Z0-9]+$', value):
            raise serializers.ValidationError("パスワードはアルファベットと数字のみで構成してください")
        
        if len(value) < 4 or len(value) > 20:
            raise serializers.ValidationError("パスワードは4-20文字で入力してください")
        
        return value
    
    def validate_name(self, value):
        """
        Validate name format: alphabetic or Japanese characters only, 1-20 characters
        """
        # Pattern for alphabetic (a-z, A-Z) or Japanese characters (hiragana, katakana, kanji)
        if not re.match(r'^[a-zA-Z\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+$', value):
            raise serializers.ValidationError("名前はアルファベットまたは日本語文字のみで構成してください")
        
        if len(value) < 1 or len(value) > 20:
            raise serializers.ValidationError("名前は1-20文字で入力してください")
        
        return value
    
    def create(self, validated_data):
        """
        Create a new user with validated data
        """
        user = User.objects.create_user(
            email=validated_data['email'],
            name=validated_data['name'],
            password=validated_data['password']
        )
        return user


class UserLoginSerializer(serializers.Serializer):
    """
    Serializer for user login
    """
    email = serializers.EmailField()
    password = serializers.CharField()
    
    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            # Check if user exists
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                raise serializers.ValidationError("存在しないemailです")
            
            # Authenticate user
            user = authenticate(username=email, password=password)
            if not user:
                raise serializers.ValidationError("パスワードが正しくありません")
            
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError("emailとpasswordは必須です")


class CoinSerializer(serializers.ModelSerializer):
    """
    Serializer for Coin model
    """
    class Meta:
        model = Coin
        fields = '__all__'


class BookmarkSerializer(serializers.ModelSerializer):
    """
    Serializer for Bookmark model
    """
    coin = CoinSerializer(read_only=True)
    
    class Meta:
        model = Bookmark
        fields = ('id', 'coin', 'created_at')