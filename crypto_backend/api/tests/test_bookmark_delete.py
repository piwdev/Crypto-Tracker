from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from api.models import Coin, Bookmark

User = get_user_model()


class BookmarkDeleteTestCase(TestCase):
    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        
        # Create test user
        self.user = User.objects.create_user(
            email='test@example.com',
            name='Test User',
            password='testpass123'
        )
        
        # Create test coin
        self.coin = Coin.objects.create(
            id='bitcoin',
            symbol='btc',
            name='Bitcoin',
            current_price=50000.00,
            market_cap_rank=1,
            last_updated='2023-01-01T00:00:00Z'
        )
        
        # Create test bookmark
        self.bookmark = Bookmark.objects.create(
            user=self.user,
            coin=self.coin
        )
        
        self.delete_url = reverse('bookmark_delete', kwargs={'coin_id': 'bitcoin'})

    def test_delete_bookmark_success(self):
        """Test successful bookmark deletion"""
        # Login the user
        self.client.force_authenticate(user=self.user)
        
        # Verify bookmark exists before deletion
        self.assertTrue(Bookmark.objects.filter(user=self.user, coin_id='bitcoin').exists())
        
        # Make DELETE request
        response = self.client.delete(self.delete_url)
        
        # Check response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'ブックマークが削除されました')
        self.assertEqual(response.data['coin_id'], 'bitcoin')
        
        # Verify bookmark was deleted
        self.assertFalse(Bookmark.objects.filter(user=self.user, coin_id='bitcoin').exists())

    def test_delete_bookmark_unauthenticated(self):
        """Test bookmark deletion without authentication"""
        # Make DELETE request without authentication
        response = self.client.delete(self.delete_url)
        
        # Check response - DRF returns 403 for IsAuthenticated permission class
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Verify bookmark still exists
        self.assertTrue(Bookmark.objects.filter(user=self.user, coin_id='bitcoin').exists())

    def test_delete_nonexistent_bookmark(self):
        """Test deletion of bookmark that doesn't exist"""
        # Login the user
        self.client.force_authenticate(user=self.user)
        
        # Try to delete bookmark for a coin that isn't bookmarked
        nonexistent_url = reverse('bookmark_delete', kwargs={'coin_id': 'ethereum'})
        response = self.client.delete(nonexistent_url)
        
        # Check response
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['error'], 'ブックマークが見つかりません')

    def test_delete_other_users_bookmark(self):
        """Test that user cannot delete another user's bookmark"""
        # Create another user
        other_user = User.objects.create_user(
            email='other@example.com',
            name='Other User',
            password='otherpass123'
        )
        
        # Create another coin and bookmark for the other user
        other_coin = Coin.objects.create(
            id='ethereum',
            symbol='eth',
            name='Ethereum',
            current_price=3000.00,
            market_cap_rank=2,
            last_updated='2023-01-01T00:00:00Z'
        )
        
        other_bookmark = Bookmark.objects.create(
            user=other_user,
            coin=other_coin
        )
        
        # Login as first user
        self.client.force_authenticate(user=self.user)
        
        # Try to delete other user's bookmark
        other_url = reverse('bookmark_delete', kwargs={'coin_id': 'ethereum'})
        response = self.client.delete(other_url)
        
        # Check response - should return 404 because the bookmark doesn't exist for this user
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['error'], 'ブックマークが見つかりません')
        
        # Verify other user's bookmark still exists
        self.assertTrue(Bookmark.objects.filter(user=other_user, coin_id='ethereum').exists())

    def test_delete_bookmark_for_nonexistent_coin(self):
        """Test deletion of bookmark for a coin that doesn't exist in the system"""
        # Login the user
        self.client.force_authenticate(user=self.user)
        
        # Try to delete bookmark for a coin that doesn't exist
        nonexistent_url = reverse('bookmark_delete', kwargs={'coin_id': 'nonexistent-coin'})
        response = self.client.delete(nonexistent_url)
        
        # Check response - should return 404 because no bookmark exists for this coin
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['error'], 'ブックマークが見つかりません')