from django.shortcuts import render
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from ..serializers import CoinListSerializer, CoinSerializer
from ..models import Coin
import requests
from datetime import datetime, timedelta


@api_view(["GET"])
@permission_classes([AllowAny])
def coin_top10_list(request):
    """
    Get list of cryptocurrencies with market cap rank 1-10

    GET /api/coins/top10

    Returns:
    - 200: List of cryptocurrencies with required fields
    - 500: Server error
    """
    try:
        # Filter coins with market_cap_rank between 1 and 10
        # Order by market_cap_rank ascending (1, 2, 3, ...)
        coins = Coin.objects.filter(
            market_cap_rank__gte=1, market_cap_rank__lte=10
        ).order_by("market_cap_rank")

        # Serialize the data with required fields only
        serializer = CoinListSerializer(coins, many=True)

        return Response(
            {"data": serializer.data, "count": len(serializer.data)},
            status=status.HTTP_200_OK,
        )

    except Exception as e:
        return Response(
            {"error": "サーバーエラーが発生しました"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
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

        return Response(
            {"data": serializer.data, "count": len(serializer.data)},
            status=status.HTTP_200_OK,
        )

    except Exception as e:
        return Response(
            {"error": "サーバーエラーが発生しました"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([AllowAny])
def coin_detail(request, coin_id):
    """
    Get cryptocurrency detail information

    GET /api/coins/detail/{coin_id}/

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

        return Response({"data": serializer.data}, status=status.HTTP_200_OK)

    except Coin.DoesNotExist:
        return Response(
            {"error": "コインが見つかりません"}, status=status.HTTP_404_NOT_FOUND
        )

    except Exception as e:
        return Response(
            {"error": "サーバーエラーが発生しました"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
