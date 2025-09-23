from django.shortcuts import render
from django.contrib.auth import login, logout
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from .serializers import UserRegistrationSerializer, UserLoginSerializer, CoinListSerializer, CoinSerializer, BookmarkCreateSerializer
from .models import User, Coin, Bookmark

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
        
        # Update last_login_at field
        user.last_login_at = timezone.now()
        user.save(update_fields=['last_login_at'])
        
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
    }, status=status.HTTP_400_BAD_REQUEST)

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

@api_view(['GET'])
@permission_classes([AllowAny])
def coin_top10_list(request):
    """
    Get list of cryptocurrencies with market cap rank 1-10
    
    GET /api/coins/
    
    Returns:
    - 200: List of cryptocurrencies with required fields
    - 500: Server error
    """
    try:
        # Filter coins with market_cap_rank between 1 and 10
        # Order by market_cap_rank ascending (1, 2, 3, ...)
        coins = Coin.objects.filter(
            market_cap_rank__gte=1,
            market_cap_rank__lte=10
        ).order_by('market_cap_rank')
        
        # Serialize the data with required fields only
        serializer = CoinListSerializer(coins, many=True)
        
        return Response({
            'data': serializer.data,
            'count': len(serializer.data)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': 'サーバーエラーが発生しました'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def coin_list(request):
    """
    Get list of whole cryptocurrencies
    GET /api/coins/list
    
    returns:
    - 200: 
    - 500:
    """
    try:
        coins = Coin.objects.all()
        
        serializer = CoinListSerializer(coins, many=True)
        
        return Response({
            'data': serializer.data,
            'count': len(serializer.data)
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response({
            'error': 'サーバーエラーが発生しました'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def coin_detail(request, coin_id):
    """
    Get cryptocurrency detail information
    
    GET /api/coins/{coin_id}/
    
    Returns:
    - 200: Coin detail with all fields
    - 404: Coin not found
    - 500: Server error
    """
    try:
        # Try to get the coin by coin_id
        coin = Coin.objects.get(id=coin_id)
        
        # Serialize the coin with all fields
        serializer = CoinSerializer(coin)
        
        return Response({
            'data': serializer.data
        }, status=status.HTTP_200_OK)
        
    except Coin.DoesNotExist:
        return Response({
            'error': 'コインが見つかりません'
        }, status=status.HTTP_404_NOT_FOUND)
        
    except Exception as e:
        return Response({
            'error': 'サーバーエラーが発生しました'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def bookmark_create(request):
    """
    Create a new bookmark for the authenticated user
    
    POST /api/bookmarks/
    
    Expected data:
    {
        "coin_id": "bitcoin"
    }
    
    Returns:
    - 201: Bookmark created successfully
    - 400: Validation errors (coin not found, duplicate bookmark)
    - 401: User not authenticated
    - 500: Server error
    """
    try:
        serializer = BookmarkCreateSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            bookmark = serializer.save()
            return Response({
                'message': 'ブックマークが追加されました',
                'bookmark': {
                    'id': bookmark.id,
                    'coin_id': bookmark.coin.id,
                    'coin_name': bookmark.coin.name,
                    'created_at': bookmark.created_at
                }
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        return Response({
            'error': 'サーバーエラーが発生しました'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def bookmark_delete(request, coin_id):
    """
    Delete a bookmark for the authenticated user
    
    DELETE /api/bookmarks/{coin_id}/
    
    Returns:
    - 200: Bookmark deleted successfully
    - 401: User not authenticated
    - 404: Bookmark not found
    - 500: Server error
    """
    try:
        # Try to find the bookmark for the authenticated user and specified coin
        bookmark = Bookmark.objects.get(user=request.user, coin_id=coin_id)
        
        # Delete the bookmark
        bookmark.delete()
        
        return Response({
            'message': 'ブックマークが削除されました',
            'coin_id': coin_id
        }, status=status.HTTP_200_OK)
        
    except Bookmark.DoesNotExist:
        return Response({
            'error': 'ブックマークが見つかりません'
        }, status=status.HTTP_404_NOT_FOUND)
        
    except Exception as e:
        return Response({
            'error': 'サーバーエラーが発生しました'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_bookmarks(request):
    """
    Get user's bookmarked cryptocurrencies
    
    GET /api/user/bookmarks/
    
    Returns:
    - 200: List of bookmarked cryptocurrencies with required fields
    - 401: User not authenticated
    - 500: Server error
    """
    try:
        # Get bookmarks for the authenticated user
        bookmarks = Bookmark.objects.filter(user=request.user).select_related('coin')
        
        # Extract the coins from bookmarks and serialize with required fields
        coins = [bookmark.coin for bookmark in bookmarks]
        serializer = CoinListSerializer(coins, many=True)
        
        return Response({
            'data': serializer.data,
            'count': len(serializer.data)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': 'サーバーエラーが発生しました'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
