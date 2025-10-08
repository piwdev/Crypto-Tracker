from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import User, Coin, Bookmark, BankBalance, Wallet, TradeHistory
from decimal import Decimal
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


class CoinListSerializer(serializers.ModelSerializer):
    """
    Serializer for Coin model - used for list view with required fields only
    """
    class Meta:
        model = Coin
        fields = [
            'id',
            'market_cap_rank',
            'image',
            'name',
            'current_price',
            'high_24h',
            'price_change_percentage_24h',
            'market_cap'
        ]


class CoinSerializer(serializers.ModelSerializer):
    """
    Serializer for Coin model - full detail view
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


class BookmarkCreateSerializer(serializers.Serializer):
    """
    Serializer for creating bookmarks
    """
    coin_id = serializers.CharField(max_length=50)
    
    def validate_coin_id(self, value):
        """
        Validate that the coin exists
        """
        try:
            Coin.objects.get(id=value)
        except Coin.DoesNotExist:
            raise serializers.ValidationError("指定されたコインが見つかりません")
        return value
    
    def validate(self, attrs):
        """
        Validate that the bookmark doesn't already exist for this user
        """
        user = self.context['request'].user
        coin_id = attrs['coin_id']
        
        if Bookmark.objects.filter(user=user, coin_id=coin_id).exists():
            raise serializers.ValidationError("このコインは既にブックマークされています")
        
        return attrs
    
    def create(self, validated_data):
        """
        Create a new bookmark
        """
        user = self.context['request'].user
        coin_id = validated_data['coin_id']
        coin = Coin.objects.get(id=coin_id)
        
        bookmark = Bookmark.objects.create(user=user, coin=coin)
        return bookmark



class TradeBuySerializer(serializers.Serializer):
    """
    Serializer for buy trade requests with validation
    """
    coin_id = serializers.CharField(max_length=50)
    quantity = serializers.DecimalField(max_digits=20, decimal_places=8)
    
    def validate_coin_id(self, value):
        """
        Validate that the coin exists
        """
        try:
            Coin.objects.get(id=value)
        except Coin.DoesNotExist:
            raise serializers.ValidationError("指定されたコインが見つかりません")
        return value
    
    def validate_quantity(self, value):
        """
        Validate that quantity is positive and has max 8 decimal places
        """
        if value <= 0:
            raise serializers.ValidationError("数量は正の数である必要があります")
        
        # Check decimal places (max 8)
        if value.as_tuple().exponent < -8:
            raise serializers.ValidationError("数量は小数点以下8桁までです")
        
        return value
    
    def validate(self, attrs):
        """
        Validate that user has sufficient balance
        """
        user = self.context['request'].user
        coin_id = attrs['coin_id']
        quantity = attrs['quantity']
        
        # Get coin and calculate total cost
        try:
            coin = Coin.objects.get(id=coin_id)
        except Coin.DoesNotExist:
            raise serializers.ValidationError("指定されたコインが見つかりません")
        
        if coin.current_price is None:
            raise serializers.ValidationError("コインの価格情報が利用できません")
        
        total_cost = quantity * coin.current_price
        
        # Check user's bank balance
        try:
            bank_balance = BankBalance.objects.get(user=user)
        except BankBalance.DoesNotExist:
            raise serializers.ValidationError("銀行残高が見つかりません")
        
        if bank_balance.cash_balance < total_cost:
            raise serializers.ValidationError("残高が不足しています")
        
        return attrs


class TradeSellSerializer(serializers.Serializer):
    """
    Serializer for sell trade requests with validation
    """
    coin_id = serializers.CharField(max_length=50)
    quantity = serializers.DecimalField(max_digits=20, decimal_places=8)
    
    def validate_coin_id(self, value):
        """
        Validate that the coin exists
        """
        try:
            Coin.objects.get(id=value)
        except Coin.DoesNotExist:
            raise serializers.ValidationError("指定されたコインが見つかりません")
        return value
    
    def validate_quantity(self, value):
        """
        Validate that quantity is positive and has max 8 decimal places
        """
        if value <= 0:
            raise serializers.ValidationError("数量は正の数である必要があります")
        
        # Check decimal places (max 8)
        if value.as_tuple().exponent < -8:
            raise serializers.ValidationError("数量は小数点以下8桁までです")
        
        return value
    
    def validate(self, attrs):
        """
        Validate that user owns the coin and has sufficient quantity
        """
        user = self.context['request'].user
        coin_id = attrs['coin_id']
        quantity = attrs['quantity']
        
        # Check if user owns the coin
        try:
            wallet = Wallet.objects.get(user=user, coin_id=coin_id)
        except Wallet.DoesNotExist:
            raise serializers.ValidationError("このコインを保有していません")
        
        # Check if user has sufficient quantity
        if wallet.quantity < quantity:
            raise serializers.ValidationError("保有数量が不足しています")
        
        return attrs


class WalletSerializer(serializers.ModelSerializer):
    """
    Serializer for wallet data with computed current_value field
    """
    coin_id = serializers.CharField(source='coin.id', read_only=True)
    coin_name = serializers.CharField(source='coin.name', read_only=True)
    coin_symbol = serializers.CharField(source='coin.symbol', read_only=True)
    coin_image = serializers.CharField(source='coin.image', read_only=True)
    current_price = serializers.DecimalField(
        source='coin.current_price',
        max_digits=1000,
        decimal_places=50,
        read_only=True
    )
    current_value = serializers.SerializerMethodField()
    
    class Meta:
        model = Wallet
        fields = [
            'coin_id',
            'coin_name',
            'coin_symbol',
            'coin_image',
            'quantity',
            'current_price',
            'current_value',
            'last_updated_at'
        ]
    
    def get_current_value(self, obj):
        """
        Calculate current value as quantity × current_price
        """
        if obj.coin.current_price is not None:
            return obj.quantity * obj.coin.current_price
        return Decimal('0')


class TradeHistorySerializer(serializers.ModelSerializer):
    """
    Serializer for trade history records with coin details
    """
    coin_id = serializers.CharField(source='coin.id', read_only=True)
    coin_name = serializers.CharField(source='coin.name', read_only=True)
    coin_symbol = serializers.CharField(source='coin.symbol', read_only=True)
    
    class Meta:
        model = TradeHistory
        fields = [
            'id',
            'coin_id',
            'coin_name',
            'coin_symbol',
            'trade_type',
            'trade_quantity',
            'trade_price_per_coin',
            'balance_before_trade',
            'balance_after_trade',
            'created_at'
        ]


class PortfolioSerializer(serializers.Serializer):
    """
    Serializer for complete portfolio with computed totals
    """
    bank_balance = serializers.DecimalField(max_digits=1000, decimal_places=50)
    wallets = WalletSerializer(many=True)
    total_portfolio_value = serializers.DecimalField(max_digits=1000, decimal_places=50)
    total_assets = serializers.DecimalField(max_digits=1000, decimal_places=50)
