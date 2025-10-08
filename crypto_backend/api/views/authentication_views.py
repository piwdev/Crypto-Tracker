from django.shortcuts import render
from django.contrib.auth import login, logout
from django.utils import timezone
from django.db import transaction
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from ..serializers import UserRegistrationSerializer, UserLoginSerializer
from ..models import User, BankBalance

# Create your views here.

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """
    User registration endpoint
    
    POST /api/auth/register/
    
    Expected data:
    {
        "email": "user@example.com",
        "name": "User Name",
        "password": "password123"
    }
    
    Returns:
    - 201: User created successfully
    - 400: Validation errors
    """
    serializer = UserRegistrationSerializer(data=request.data)
    
    if serializer.is_valid():
        user = serializer.save()
        
        # Create initial bank balance for demo trading
        BankBalance.objects.create(user=user)
        
        # Create or get token for the user
        token, created = Token.objects.get_or_create(user=user)
        
        return Response({
            'message': 'ユーザー登録が完了しました',
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.name
            },
            'token': token.key
        }, status=status.HTTP_201_CREATED)
    
    return Response({
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    User login endpoint
    
    POST /api/auth/login/
    
    Expected data:
    {
        "email": "user@example.com",
        "password": "password123"
    }
    
    Returns:
    - 200: Login successful
    - 400: Validation errors
    """
    serializer = UserLoginSerializer(data=request.data)
    
    if serializer.is_valid():
        user = serializer.validated_data['user']
        
        # Log the user in (creates session)
        login(request, user)
        
        # Ensure user has a BankBalance record (atomic operation)
        with transaction.atomic():
            # Update last_login_at field
            user.last_login_at = timezone.now()
            user.save(update_fields=['last_login_at'])
            
            # Check if BankBalance exists, create if missing
            if not hasattr(user, 'bank_balance'):
                BankBalance.objects.create(user=user)
        
        # Create or get token for the user
        token, created = Token.objects.get_or_create(user=user)
        
        return Response({
            'message': 'ログインが成功しました',
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.name
            },
            'token': token.key
        }, status=status.HTTP_200_OK)
    
    return Response({
        'errors': serializer.errors
    }, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    User logout endpoint
    
    POST /api/auth/logout/
    
    Logs out the authenticated user by invalidating their session and token.
    
    Returns:
    - 200: Logout successful
    - 401: User not authenticated
    """
    try:
        # Delete the user's token
        request.user.auth_token.delete()
    except (AttributeError, Token.DoesNotExist):
        pass
    
    # Log the user out (invalidates session)
    logout(request)
    
    return Response({
        'message': 'ログアウトが完了しました'
    }, status=status.HTTP_200_OK)


