from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from decimal import Decimal
from ..models import Coin, Bookmark

User = get_user_model()


class UserBookmarksTestCase(TestCase):
    """Test cases for user bookmarks endpoint"""

    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        
        # Create test user
        self.user = User.objects.create_user(
            email='test@example.com',
            name='Test User',
            password='testpass123'
        )
        
        # Create test coins
        self.coin1 = Coin.objects.create(
            id='bitcoin',
            symbol='btc',
            name='Bitcoin',
            image='https://example.com/bitcoin.png',
            current_price=Decimal('50000.00'),
            market_cap_rank=1,
            high_24h=Decimal('51000.00'),
            price_change_percentage_24h=Decimal('2.5'),
            market_cap=1000000000,
            last_updated='2023-01-01T00:00:00Z'
        )
        
        self.coin2 = Coin.objects.create(
            id='ethereum',
            symbol='eth',
            name='Ethereum',
            image='https://example.com/ethereum.png',
            current_price=Decimal('3000.00'),
            market_cap_rank=2,
            high_24h=Decimal('3100.00'),
            price_change_percentage_24h=Decimal('1.8'),
            market_cap=500000000,
            last_updated='2023-01-01T00:00:00Z'
        )
        
        self.coin3 = Coin.objects.create(
            id='cardano',
            symbol='ada',
            name='Cardano',
            image='https://example.com/cardano.png',
            current_price=Decimal('0.50'),
            market_cap_rank=3,
            high_24h=Decimal('0.52'),
            price_change_percentage_24h=Decimal('-1.2'),
            market_cap=200000000,
            last_updated='2023-01-01T00:00:00Z'
        )
        
        # Create bookmarks for user
        self.bookmark1 = Bookmark.objects.create(user=self.user, coin=self.coin1)
        self.bookmark2 = Bookmark.objects.create(user=self.user, coin=self.coin2)
        
        # Create another user with different bookmarks
        self.other_user = User.objects.create_user(
            email='other@example.com',
            name='Other User',
            password='otherpass123'
        )
        self.other_bookmark = Bookmark.objects.create(user=self.other_user, coin=self.coin3)
        
        self.url = reverse('user_bookmarks')

    def test_get_user_bookmarks_success(self):
        """Test successful retrieval of user bookmarks"""
        # Authenticate user
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('data', response.data)
        self.assertIn('count', response.data)
        self.assertEqual(response.data['count'], 2)
        
        # Check that only user's bookmarked coins are returned
        coin_ids = [coin['id'] for coin in response.data['data']]
        self.assertIn('bitcoin', coin_ids)
        self.assertIn('ethereum', coin_ids)
        self.assertNotIn('cardano', coin_ids)  # This belongs to other_user
        
        # Check that required fields are present
        for coin in response.data['data']:
            self.assertIn('id', coin)
            self.assertIn('market_cap_rank', coin)
            self.assertIn('image', coin)
            self.assertIn('name', coin)
            self.assertIn('current_price', coin)
            self.assertIn('high_24h', coin)
            self.assertIn('price_change_percentage_24h', coin)
            self.assertIn('market_cap', coin)

    def test_get_user_bookmarks_unauthenticated(self):
        """Test that unauthenticated users cannot access bookmarks"""
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_get_user_bookmarks_empty(self):
        """Test user with no bookmarks"""
        # Create user with no bookmarks
        empty_user = User.objects.create_user(
            email='empty@example.com',
            name='Empty User',
            password='emptypass123'
        )
        
        self.client.force_authenticate(user=empty_user)
        
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 0)
        self.assertEqual(len(response.data['data']), 0)

    def test_user_bookmarks_only_returns_own_bookmarks(self):
        """Test that users only see their own bookmarks"""
        # Authenticate as other_user
        self.client.force_authenticate(user=self.other_user)
        
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        
        # Should only see cardano (other_user's bookmark)
        coin_ids = [coin['id'] for coin in response.data['data']]
        self.assertIn('cardano', coin_ids)
        self.assertNotIn('bitcoin', coin_ids)
        self.assertNotIn('ethereum', coin_ids)

    def test_user_bookmarks_correct_serialization(self):
        """Test that bookmarks are serialized with correct fields"""
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Find bitcoin in response
        bitcoin_data = None
        for coin in response.data['data']:
            if coin['id'] == 'bitcoin':
                bitcoin_data = coin
                break
        
        self.assertIsNotNone(bitcoin_data)
        self.assertEqual(bitcoin_data['name'], 'Bitcoin')
        self.assertEqual(bitcoin_data['market_cap_rank'], 1)
        self.assertEqual(bitcoin_data['image'], 'https://example.com/bitcoin.png')
        self.assertEqual(float(bitcoin_data['current_price']), 50000.00)
        self.assertEqual(float(bitcoin_data['high_24h']), 51000.00)
        self.assertEqual(float(bitcoin_data['price_change_percentage_24h']), 2.5)
        self.assertEqual(bitcoin_data['market_cap'], 1000000000)