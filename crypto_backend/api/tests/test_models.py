"""
Tests for Django models
"""
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.utils import timezone
from decimal import Decimal
from ..models import User, Coin, Bookmark


class UserModelTest(TestCase):
    """Test cases for User model"""
    
    def test_create_user_with_email_and_name(self):
        """Test creating a user with email and name"""
        user = User.objects.create_user(
            email='test@example.com',
            name='Test User',
            password='testpass123'
        )
        
        self.assertEqual(user.email, 'test@example.com')
        self.assertEqual(user.name, 'Test User')
        self.assertTrue(user.check_password('testpass123'))
        self.assertIsNotNone(user.created_at)
        self.assertIsNone(user.last_login_at)
        
    def test_create_superuser(self):
        """Test creating a superuser"""
        user = User.objects.create_superuser(
            email='admin@example.com',
            name='Admin User',
            password='adminpass123'
        )
        
        self.assertEqual(user.email, 'admin@example.com')
        self.assertEqual(user.name, 'Admin User')
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)
        
    def test_user_str_representation(self):
        """Test string representation of User model"""
        user = User.objects.create_user(
            email='test@example.com',
            name='Test User',
            password='testpass123'
        )
        
        self.assertEqual(str(user), 'test@example.com')
        
    def test_user_email_uniqueness(self):
        """Test that email must be unique"""
        User.objects.create_user(
            email='test@example.com',
            name='First User',
            password='testpass123'
        )
        
        with self.assertRaises(IntegrityError):
            User.objects.create_user(
                email='test@example.com',
                name='Second User',
                password='testpass456'
            )
            
    def test_user_username_auto_set(self):
        """Test that username is automatically set to email"""
        user = User.objects.create_user(
            email='test@example.com',
            name='Test User',
            password='testpass123'
        )
        
        self.assertEqual(user.username, 'test@example.com')
        
    def test_create_user_without_email_raises_error(self):
        """Test that creating user without email raises ValueError"""
        with self.assertRaises(ValueError) as context:
            User.objects.create_user(
                email='',
                name='Test User',
                password='testpass123'
            )
        
        self.assertEqual(str(context.exception), 'The Email field must be set')
        
    def test_create_user_without_name_raises_error(self):
        """Test that creating user without name raises ValueError"""
        with self.assertRaises(ValueError) as context:
            User.objects.create_user(
                email='test@example.com',
                name='',
                password='testpass123'
            )
        
        self.assertEqual(str(context.exception), 'The Name field must be set')
        
    def test_create_superuser_without_is_staff_raises_error(self):
        """Test that creating superuser with is_staff=False raises ValueError"""
        with self.assertRaises(ValueError) as context:
            User.objects.create_superuser(
                email='admin@example.com',
                name='Admin User',
                password='adminpass123',
                is_staff=False
            )
        
        self.assertEqual(str(context.exception), 'Superuser must have is_staff=True.')
        
    def test_create_superuser_without_is_superuser_raises_error(self):
        """Test that creating superuser with is_superuser=False raises ValueError"""
        with self.assertRaises(ValueError) as context:
            User.objects.create_superuser(
                email='admin@example.com',
                name='Admin User',
                password='adminpass123',
                is_superuser=False
            )
        
        self.assertEqual(str(context.exception), 'Superuser must have is_superuser=True.')


class CoinModelTest(TestCase):
    """Test cases for Coin model"""
    
    def setUp(self):
        """Set up test data"""
        self.coin_data = {
            'id': 'bitcoin',
            'symbol': 'btc',
            'name': 'Bitcoin',
            'image': 'https://example.com/bitcoin.png',
            'current_price': 50000,
            'market_cap': 1000000000000,
            'market_cap_rank': 1,
            'high_24h': 51000,
            'price_change_percentage_24h': 2.5,
            'roi': {'times': 100, 'currency': 'usd', 'percentage': 10000},
            'last_updated': timezone.now()
        }
        
    def test_create_coin_with_all_fields(self):
        """Test creating a coin with all fields"""
        coin = Coin.objects.create(**self.coin_data)
        
        self.assertEqual(coin.id, 'bitcoin')
        self.assertEqual(coin.symbol, 'btc')
        self.assertEqual(coin.name, 'Bitcoin')
        self.assertEqual(coin.market_cap_rank, 1)
        self.assertEqual(coin.current_price, Decimal('50000.00000000'))
        self.assertIsNotNone(coin.created_at)
        self.assertIsNotNone(coin.updated_at)
        
    def test_create_coin_with_minimal_fields(self):
        """Test creating a coin with only required fields"""
        minimal_coin = Coin.objects.create(
            id='minimal-coin',
            symbol='min',
            name='Minimal Coin',
            last_updated=timezone.now()
        )
        
        self.assertEqual(minimal_coin.id, 'minimal-coin')
        self.assertEqual(minimal_coin.symbol, 'min')
        self.assertEqual(minimal_coin.name, 'Minimal Coin')
        self.assertIsNone(minimal_coin.current_price)
        self.assertIsNone(minimal_coin.market_cap)
        self.assertIsNone(minimal_coin.market_cap_rank)
        
    def test_coin_str_representation(self):
        """Test string representation of Coin model"""
        coin = Coin.objects.create(**self.coin_data)
        
        self.assertEqual(str(coin), 'Bitcoin (BTC)')
        
    def test_coin_ordering(self):
        """Test default ordering by market_cap_rank"""
        # Create coins with different ranks
        coin1 = Coin.objects.create(
            id='bitcoin',
            symbol='btc',
            name='Bitcoin',
            market_cap_rank=1,
            last_updated=timezone.now()
        )
        coin2 = Coin.objects.create(
            id='ethereum',
            symbol='eth',
            name='Ethereum',
            market_cap_rank=2,
            last_updated=timezone.now()
        )
        coin3 = Coin.objects.create(
            id='binancecoin',
            symbol='bnb',
            name='BNB',
            market_cap_rank=3,
            last_updated=timezone.now()
        )
        
        coins = list(Coin.objects.all())
        
        self.assertEqual(coins[0], coin1)
        self.assertEqual(coins[1], coin2)
        self.assertEqual(coins[2], coin3)
        
    def test_coin_id_uniqueness(self):
        """Test that coin id must be unique"""
        Coin.objects.create(**self.coin_data)
        
        with self.assertRaises(IntegrityError):
            Coin.objects.create(**self.coin_data)
            
    def test_coin_decimal_precision(self):
        """Test decimal field precision handling"""
        coin = Coin.objects.create(**self.coin_data)
        
        # Test that decimal values are stored with correct precision
        self.assertEqual(coin.current_price, Decimal('50000.00000000'))
        self.assertEqual(coin.high_24h, Decimal('51000.00000000'))
        self.assertEqual(coin.price_change_percentage_24h, Decimal('2.500000'))
        
    def test_coin_json_field(self):
        """Test JSON field functionality"""
        coin = Coin.objects.create(**self.coin_data)
        
        self.assertEqual(coin.roi['times'], 100)
        self.assertEqual(coin.roi['currency'], 'usd')
        self.assertEqual(coin.roi['percentage'], 10000)
        
    def test_coin_null_fields(self):
        """Test that nullable fields can be None"""
        coin_data = {
            'id': 'test-coin',
            'symbol': 'test',
            'name': 'Test Coin',
            'last_updated': timezone.now(),
            'current_price': None,
            'market_cap': None,
            'market_cap_rank': None,
            'roi': None
        }
        
        coin = Coin.objects.create(**coin_data)
        
        self.assertIsNone(coin.current_price)
        self.assertIsNone(coin.market_cap)
        self.assertIsNone(coin.market_cap_rank)
        self.assertIsNone(coin.roi)


class BookmarkModelTest(TestCase):
    """Test cases for Bookmark model"""
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            email='test@example.com',
            name='Test User',
            password='testpass123'
        )
        
        self.coin = Coin.objects.create(
            id='bitcoin',
            symbol='btc',
            name='Bitcoin',
            last_updated=timezone.now()
        )
        
    def test_create_bookmark(self):
        """Test creating a bookmark"""
        bookmark = Bookmark.objects.create(
            user=self.user,
            coin=self.coin
        )
        
        self.assertEqual(bookmark.user, self.user)
        self.assertEqual(bookmark.coin, self.coin)
        self.assertIsNotNone(bookmark.created_at)
        
    def test_bookmark_str_representation(self):
        """Test string representation of Bookmark model"""
        bookmark = Bookmark.objects.create(
            user=self.user,
            coin=self.coin
        )
        
        expected_str = f"{self.user.email} bookmarked {self.coin.name}"
        self.assertEqual(str(bookmark), expected_str)
        
    def test_bookmark_unique_together_constraint(self):
        """Test that user-coin combination must be unique"""
        Bookmark.objects.create(
            user=self.user,
            coin=self.coin
        )
        
        with self.assertRaises(IntegrityError):
            Bookmark.objects.create(
                user=self.user,
                coin=self.coin
            )
            
    def test_bookmark_ordering(self):
        """Test default ordering by created_at descending"""
        # Create bookmarks with slight time differences
        bookmark1 = Bookmark.objects.create(
            user=self.user,
            coin=self.coin
        )
        
        # Create another coin and bookmark
        coin2 = Coin.objects.create(
            id='ethereum',
            symbol='eth',
            name='Ethereum',
            last_updated=timezone.now()
        )
        
        bookmark2 = Bookmark.objects.create(
            user=self.user,
            coin=coin2
        )
        
        bookmarks = list(Bookmark.objects.all())
        
        # Most recent bookmark should be first
        self.assertEqual(bookmarks[0], bookmark2)
        self.assertEqual(bookmarks[1], bookmark1)
        
    def test_bookmark_cascade_delete_user(self):
        """Test that bookmarks are deleted when user is deleted"""
        bookmark = Bookmark.objects.create(
            user=self.user,
            coin=self.coin
        )
        
        self.assertEqual(Bookmark.objects.count(), 1)
        
        self.user.delete()
        
        self.assertEqual(Bookmark.objects.count(), 0)
        
    def test_bookmark_cascade_delete_coin(self):
        """Test that bookmarks are deleted when coin is deleted"""
        bookmark = Bookmark.objects.create(
            user=self.user,
            coin=self.coin
        )
        
        self.assertEqual(Bookmark.objects.count(), 1)
        
        self.coin.delete()
        
        self.assertEqual(Bookmark.objects.count(), 0)
        
    def test_bookmark_related_names(self):
        """Test related names for foreign key relationships"""
        bookmark = Bookmark.objects.create(
            user=self.user,
            coin=self.coin
        )
        
        # Test user's bookmarks
        user_bookmarks = self.user.bookmarks_user.all()
        self.assertIn(bookmark, user_bookmarks)
        
        # Test coin's bookmarks
        coin_bookmarks = self.coin.bookmarks_coin.all()
        self.assertIn(bookmark, coin_bookmarks)
        
    def test_multiple_users_bookmark_same_coin(self):
        """Test that multiple users can bookmark the same coin"""
        user2 = User.objects.create_user(
            email='user2@example.com',
            name='User Two',
            password='testpass456'
        )
        
        bookmark1 = Bookmark.objects.create(
            user=self.user,
            coin=self.coin
        )
        
        bookmark2 = Bookmark.objects.create(
            user=user2,
            coin=self.coin
        )
        
        self.assertEqual(Bookmark.objects.count(), 2)
        self.assertNotEqual(bookmark1, bookmark2)
        
    def test_user_bookmark_multiple_coins(self):
        """Test that one user can bookmark multiple coins"""
        coin2 = Coin.objects.create(
            id='ethereum',
            symbol='eth',
            name='Ethereum',
            last_updated=timezone.now()
        )
        
        bookmark1 = Bookmark.objects.create(
            user=self.user,
            coin=self.coin
        )
        
        bookmark2 = Bookmark.objects.create(
            user=self.user,
            coin=coin2
        )
        
        self.assertEqual(Bookmark.objects.count(), 2)
        self.assertEqual(self.user.bookmarks_user.count(), 2)