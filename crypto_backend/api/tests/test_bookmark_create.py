"""
Tests for bookmark creation API endpoint
"""
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from ..models import User, Coin, Bookmark


class BookmarkCreateAPITestCase(TestCase):
    """Test cases for bookmark creation API"""
    
    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        self.bookmark_create_url = reverse('bookmark_create')
        
        # Create a test user
        self.test_user = User.objects.create_user(
            email='test@example.com',
            name='Test User',
            password='testpass123'
        )
        
        # Create test coins
        self.test_coin = Coin.objects.create(
            id='bitcoin',
            symbol='btc',
            name='Bitcoin',
            image='https://example.com/bitcoin.png',
            current_price=50000.00,
            market_cap=1000000000,
            market_cap_rank=1,
            high_24h=51000.00,
            low_24h=49000.00,
            price_change_24h=1000.00,
            price_change_percentage_24h=2.04,
            last_updated=timezone.now()
        )
        
        self.test_coin2 = Coin.objects.create(
            id='ethereum',
            symbol='eth',
            name='Ethereum',
            image='https://example.com/ethereum.png',
            current_price=3000.00,
            market_cap=500000000,
            market_cap_rank=2,
            high_24h=3100.00,
            low_24h=2900.00,
            price_change_24h=100.00,
            price_change_percentage_24h=3.45,
            last_updated=timezone.now()
        )
        
        self.valid_bookmark_data = {
            'coin_id': 'bitcoin'
        }
        
    def test_successful_bookmark_creation_authenticated_user(self):
        """Test successful bookmark creation with authenticated user"""
        # Authenticate the user
        self.client.force_authenticate(user=self.test_user)
        
        response = self.client.post(self.bookmark_create_url, self.valid_bookmark_data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('message', response.data)
        self.assertEqual(response.data['message'], 'ブックマークが追加されました')
        self.assertIn('bookmark', response.data)
        self.assertEqual(response.data['bookmark']['coin_id'], 'bitcoin')
        self.assertEqual(response.data['bookmark']['coin_name'], 'Bitcoin')
        
        # Verify bookmark was created in database
        bookmark = Bookmark.objects.get(user=self.test_user, coin=self.test_coin)
        self.assertIsNotNone(bookmark)
        self.assertEqual(bookmark.coin.id, 'bitcoin')
        
    def test_bookmark_creation_unauthenticated_user(self):
        """Test bookmark creation fails for unauthenticated user"""
        response = self.client.post(self.bookmark_create_url, self.valid_bookmark_data)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Verify no bookmark was created
        self.assertEqual(Bookmark.objects.count(), 0)
        
    def test_bookmark_creation_nonexistent_coin(self):
        """Test bookmark creation with nonexistent coin"""
        self.client.force_authenticate(user=self.test_user)
        
        invalid_data = {
            'coin_id': 'nonexistent-coin'
        }
        
        response = self.client.post(self.bookmark_create_url, invalid_data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('errors', response.data)
        self.assertIn('指定されたコインが見つかりません', str(response.data['errors']))
        
        # Verify no bookmark was created
        self.assertEqual(Bookmark.objects.count(), 0)
        
    def test_duplicate_bookmark_prevention(self):
        """Test that duplicate bookmarks are prevented"""
        self.client.force_authenticate(user=self.test_user)
        
        # Create first bookmark
        response1 = self.client.post(self.bookmark_create_url, self.valid_bookmark_data)
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)
        
        # Try to create duplicate bookmark
        response2 = self.client.post(self.bookmark_create_url, self.valid_bookmark_data)
        self.assertEqual(response2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('errors', response2.data)
        self.assertIn('このコインは既にブックマークされています', str(response2.data['errors']))
        
        # Verify only one bookmark exists
        self.assertEqual(Bookmark.objects.filter(user=self.test_user, coin=self.test_coin).count(), 1)
        
    def test_bookmark_creation_missing_coin_id(self):
        """Test bookmark creation with missing coin_id field"""
        self.client.force_authenticate(user=self.test_user)
        
        response = self.client.post(self.bookmark_create_url, {})
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('errors', response.data)
        
        # Verify no bookmark was created
        self.assertEqual(Bookmark.objects.count(), 0)
        
    def test_bookmark_creation_empty_coin_id(self):
        """Test bookmark creation with empty coin_id"""
        self.client.force_authenticate(user=self.test_user)
        
        invalid_data = {
            'coin_id': ''
        }
        
        response = self.client.post(self.bookmark_create_url, invalid_data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('errors', response.data)
        
        # Verify no bookmark was created
        self.assertEqual(Bookmark.objects.count(), 0)
        
    def test_multiple_users_can_bookmark_same_coin(self):
        """Test that multiple users can bookmark the same coin"""
        # Create another user
        user2 = User.objects.create_user(
            email='test2@example.com',
            name='Test User 2',
            password='testpass123'
        )
        
        # First user creates bookmark
        self.client.force_authenticate(user=self.test_user)
        response1 = self.client.post(self.bookmark_create_url, self.valid_bookmark_data)
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)
        
        # Second user creates bookmark for same coin
        self.client.force_authenticate(user=user2)
        response2 = self.client.post(self.bookmark_create_url, self.valid_bookmark_data)
        self.assertEqual(response2.status_code, status.HTTP_201_CREATED)
        
        # Verify both bookmarks exist
        self.assertEqual(Bookmark.objects.filter(coin=self.test_coin).count(), 2)
        self.assertEqual(Bookmark.objects.filter(user=self.test_user, coin=self.test_coin).count(), 1)
        self.assertEqual(Bookmark.objects.filter(user=user2, coin=self.test_coin).count(), 1)
        
    def test_user_can_bookmark_multiple_coins(self):
        """Test that a user can bookmark multiple different coins"""
        self.client.force_authenticate(user=self.test_user)
        
        # Bookmark first coin
        response1 = self.client.post(self.bookmark_create_url, {'coin_id': 'bitcoin'})
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)
        
        # Bookmark second coin
        response2 = self.client.post(self.bookmark_create_url, {'coin_id': 'ethereum'})
        self.assertEqual(response2.status_code, status.HTTP_201_CREATED)
        
        # Verify both bookmarks exist for the user
        self.assertEqual(Bookmark.objects.filter(user=self.test_user).count(), 2)
        self.assertTrue(Bookmark.objects.filter(user=self.test_user, coin=self.test_coin).exists())
        self.assertTrue(Bookmark.objects.filter(user=self.test_user, coin=self.test_coin2).exists())