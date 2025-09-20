from django.shortcuts import render
from django.contrib.auth import login, logout
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from .serializers import UserRegistrationSerializer, UserLoginSerializer
from .models import User

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
        return Response({
            'message': 'ユーザー登録が完了しました',
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.name
            }
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
        
        # Update last_login_at field
        user.last_login_at = timezone.now()
        user.save(update_fields=['last_login_at'])
        
        return Response({
            'message': 'ログインが成功しました',
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.name
            }
        }, status=status.HTTP_200_OK)
    
    return Response({
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def logout_view(request):
    """
    User logout endpoint
    
    POST /api/auth/logout/
    
    Logs out the authenticated user by invalidating their session.
    
    Returns:
    - 200: Logout successful
    - 401: User not authenticated
    """
    if request.user.is_authenticated:
        # Log the user out (invalidates session)
        logout(request)
        return Response({
            'message': 'ログアウトが完了しました'
        }, status=status.HTTP_200_OK)
    else:
        return Response({
            'error': 'ユーザーがログインしていません'
        }, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['GET'])
def coin_list(request):
    """Get list of cryptocurrencies"""
    return Response({'message': 'Coin list endpoint - to be implemented'}, status=status.HTTP_200_OK)

@api_view(['GET'])
def coin_detail(request, coin_id):
    """Get cryptocurrency detail"""
    return Response({'message': f'Coin detail endpoint for {coin_id} - to be implemented'}, status=status.HTTP_200_OK)

@api_view(['POST'])
def bookmark_create(request):
    """Create bookmark"""
    return Response({'message': 'Bookmark create endpoint - to be implemented'}, status=status.HTTP_200_OK)

@api_view(['DELETE'])
def bookmark_delete(request, coin_id):
    """Delete bookmark"""
    return Response({'message': f'Bookmark delete endpoint for {coin_id} - to be implemented'}, status=status.HTTP_200_OK)

@api_view(['GET'])
def user_bookmarks(request):
    """Get user bookmarks"""
    return Response({'message': 'User bookmarks endpoint - to be implemented'}, status=status.HTTP_200_OK)
