from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

# Create your views here.

@api_view(['POST'])
def register(request):
    """User registration endpoint"""
    return Response({'message': 'Register endpoint - to be implemented'}, status=status.HTTP_200_OK)

@api_view(['POST'])
def login_view(request):
    """User login endpoint"""
    return Response({'message': 'Login endpoint - to be implemented'}, status=status.HTTP_200_OK)

@api_view(['POST'])
def logout_view(request):
    """User logout endpoint"""
    return Response({'message': 'Logout endpoint - to be implemented'}, status=status.HTTP_200_OK)

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
