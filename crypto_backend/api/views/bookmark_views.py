from django.shortcuts import render
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token

from ..serializers import BookmarkCreateSerializer, CoinListSerializer
from ..models import Bookmark

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