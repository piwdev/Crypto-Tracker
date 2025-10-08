from django.db import transaction
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from ..serializers import TradeBuySerializer, TradeSellSerializer, PortfolioSerializer, WalletSerializer, TradeHistorySerializer
from ..models import BankBalance, Wallet, TradeHistory, Coin
from decimal import Decimal
from django.core.paginator import Paginator, EmptyPage


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def trade_buy(request):
    """
    Buy trade endpoint
    
    POST /api/trades/buy/
    
    Expected data:
    {
        "coin_id": "bitcoin",
        "quantity": "0.5"
    }
    
    Returns:
    - 201: Purchase completed successfully
    - 400: Validation errors or insufficient balance
    """
    serializer = TradeBuySerializer(data=request.data, context={'request': request})
    
    if not serializer.is_valid():
        return Response({
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    user = request.user
    coin_id = serializer.validated_data['coin_id']
    quantity = serializer.validated_data['quantity']
    
    try:
        with transaction.atomic():
            # Lock user's BankBalance record
            bank_balance = BankBalance.objects.select_for_update().get(user=user)
            
            # Get coin and calculate total cost
            coin = Coin.objects.get(id=coin_id)
            total_cost = quantity * coin.current_price
            
            # Verify sufficient balance (double-check)
            if bank_balance.cash_balance < total_cost:
                return Response({
                    'error': '残高が不足しています'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Store balance before trade
            balance_before = bank_balance.cash_balance
            
            # Deduct from bank balance
            bank_balance.cash_balance -= total_cost
            bank_balance.save()
            
            # Get or create Wallet entry
            wallet, created = Wallet.objects.select_for_update().get_or_create(
                user=user,
                coin=coin,
                defaults={'quantity': 0}
            )
            
            # Add purchased quantity to wallet
            wallet.quantity += quantity
            wallet.save()
            
            # Create TradeHistory record
            TradeHistory.objects.create(
                user=user,
                coin=coin,
                trade_type='BUY',
                trade_quantity=quantity,
                trade_price_per_coin=coin.current_price,
                balance_before_trade=balance_before,
                balance_after_trade=bank_balance.cash_balance
            )
            
            return Response({
                'message': '購入が完了しました',
                'trade': {
                    'coin_id': coin.id,
                    'coin_name': coin.name,
                    'quantity': str(quantity),
                    'price_per_coin': str(coin.current_price),
                    'total_cost': str(total_cost),
                    'new_balance': str(bank_balance.cash_balance)
                }
            }, status=status.HTTP_201_CREATED)
            
    except BankBalance.DoesNotExist:
        return Response({
            'error': '銀行残高が見つかりません'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Coin.DoesNotExist:
        return Response({
            'error': '指定されたコインが見つかりません'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            'error': 'サーバーエラーが発生しました'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def trade_sell(request):
    """
    Sell trade endpoint
    
    POST /api/trades/sell/
    
    Expected data:
    {
        "coin_id": "bitcoin",
        "quantity": "0.25"
    }
    
    Returns:
    - 200: Sale completed successfully
    - 400: Validation errors, insufficient quantity, or coin not owned
    """
    serializer = TradeSellSerializer(data=request.data, context={'request': request})
    
    if not serializer.is_valid():
        return Response({
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    user = request.user
    coin_id = serializer.validated_data['coin_id']
    quantity = serializer.validated_data['quantity']
    
    try:
        with transaction.atomic():
            # Lock user's Wallet record
            try:
                wallet = Wallet.objects.select_for_update().get(user=user, coin_id=coin_id)
            except Wallet.DoesNotExist:
                return Response({
                    'error': 'このコインを保有していません'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Verify sufficient quantity (double-check)
            if wallet.quantity < quantity:
                return Response({
                    'error': '保有数量が不足しています'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Lock user's BankBalance record
            bank_balance = BankBalance.objects.select_for_update().get(user=user)
            
            # Get coin and calculate total proceeds
            coin = Coin.objects.get(id=coin_id)
            total_proceeds = quantity * coin.current_price
            
            # Store balance before trade
            balance_before = bank_balance.cash_balance
            
            # Deduct quantity from wallet
            wallet.quantity -= quantity
            
            # Delete wallet entry if quantity becomes zero
            if wallet.quantity == 0:
                wallet.delete()
            else:
                wallet.save()
            
            # Add proceeds to bank balance
            bank_balance.cash_balance += total_proceeds
            bank_balance.save()
            
            # Create TradeHistory record
            TradeHistory.objects.create(
                user=user,
                coin=coin,
                trade_type='SELL',
                trade_quantity=quantity,
                trade_price_per_coin=coin.current_price,
                balance_before_trade=balance_before,
                balance_after_trade=bank_balance.cash_balance
            )
            
            return Response({
                'message': '売却が完了しました',
                'trade': {
                    'coin_id': coin.id,
                    'coin_name': coin.name,
                    'quantity': str(quantity),
                    'price_per_coin': str(coin.current_price),
                    'total_proceeds': str(total_proceeds),
                    'new_balance': str(bank_balance.cash_balance)
                }
            }, status=status.HTTP_200_OK)
            
    except BankBalance.DoesNotExist:
        return Response({
            'error': '銀行残高が見つかりません'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Coin.DoesNotExist:
        return Response({
            'error': '指定されたコインが見つかりません'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            'error': 'サーバーエラーが発生しました'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_portfolio(request):
    """
    Portfolio view endpoint
    
    GET /api/user/portfolio/
    
    Returns:
    - 200: Portfolio data with bank balance, wallets, and computed totals
    - 400: Missing data errors
    """
    user = request.user
    
    try:
        # Fetch user's BankBalance
        bank_balance = BankBalance.objects.get(user=user)
        
        # Fetch all Wallet entries with select_related for Coin data
        wallets = Wallet.objects.filter(user=user).select_related('coin')
        
        # Calculate current_value for each wallet and total_portfolio_value
        total_portfolio_value = Decimal('0')
        for wallet in wallets:
            if wallet.coin.current_price is not None:
                total_portfolio_value += wallet.quantity * wallet.coin.current_price
        
        # Calculate total_assets (bank_balance + total_portfolio_value)
        total_assets = bank_balance.cash_balance + total_portfolio_value
        
        # Serialize data using PortfolioSerializer
        portfolio_data = {
            'bank_balance': bank_balance.cash_balance,
            'wallets': wallets,
            'total_portfolio_value': total_portfolio_value,
            'total_assets': total_assets
        }
        
        serializer = PortfolioSerializer(portfolio_data)
        
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    except BankBalance.DoesNotExist:
        return Response({
            'error': '銀行残高が見つかりません'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            'error': 'サーバーエラーが発生しました'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_trade_history(request):
    """
    Trade history view endpoint
    
    GET /api/user/trade-history/
    
    Query Parameters:
    - page (optional): Page number for pagination
    - page_size (optional): Items per page (default: 20, max: 100)
    
    Returns:
    - 200: Paginated trade history data
    """
    user = request.user
    
    try:
        # Fetch user's TradeHistory records with select_related for Coin data
        trade_history = TradeHistory.objects.filter(user=user).select_related('coin').order_by('-created_at')
        
        # Get pagination parameters
        page = request.GET.get('page', 1)
        page_size = request.GET.get('page_size', 20)
        
        # Validate and set page_size (default: 20, max: 100)
        try:
            page_size = int(page_size)
            if page_size > 100:
                page_size = 100
            elif page_size < 1:
                page_size = 20
        except (ValueError, TypeError):
            page_size = 20
        
        # Validate page number
        try:
            page = int(page)
            if page < 1:
                page = 1
        except (ValueError, TypeError):
            page = 1
        
        # Implement pagination
        paginator = Paginator(trade_history, page_size)
        total_pages = paginator.num_pages
        
        try:
            paginated_trades = paginator.page(page)
        except EmptyPage:
            # If page is out of range, return empty results
            paginated_trades = paginator.page(paginator.num_pages) if paginator.num_pages > 0 else []
            if paginator.num_pages > 0:
                page = paginator.num_pages
        
        # Serialize data using TradeHistorySerializer
        serializer = TradeHistorySerializer(paginated_trades, many=True)
        
        # Return paginated response
        return Response({
            'data': serializer.data,
            'count': paginator.count,
            'page': page,
            'page_size': page_size,
            'total_pages': total_pages
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': 'サーバーエラーが発生しました'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
