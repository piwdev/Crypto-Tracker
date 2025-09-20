from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from api.models import Coin, Bookmark

User = get_user_model()


class BookmarkIntegrationTestCase(TestCase):
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
        
        self.create_url = reverse('bookmark_create')
        self.delete_url = reverse('bookmark_delete', kwargs={'coin_id': 'bitcoin'})

    def test_bookmark_create_and_delete_flow(self):
        """Test the complete bookmark create and delete flow"""
        # Login the user
        self.client.force_authenticate(user=self.user)
        
        # Verify no bookmark exists initially
        self.assertFalse(Bookmark.objects.filter(user=self.user, coin_id='bitcoin').exists())
        
        # Create bookmark
        create_response = self.client.post(self.create_url, {'coin_id': 'bitcoin'})
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(create_response.data['message'], 'ブックマークが追加されました')
        
        # Verify bookmark was created
        self.assertTrue(Bookmark.objects.filter(user=self.user, coin_id='bitcoin').exists())
        
        # Delete bookmark
        delete_response = self.client.delete(self.delete_url)
        self.assertEqual(delete_response.status_code, status.HTTP_200_OK)
        self.assertEqual(delete_response.data['message'], 'ブックマークが削除されました')
        self.assertEqual(delete_response.data['coin_id'], 'bitcoin')
        
        # Verify bookmark was deleted
        self.assertFalse(Bookmark.objects.filter(user=self.user, coin_id='bitcoin').exists())

    def test_delete_nonexistent_bookmark_after_creation(self):
        """Test deleting a bookmark that was created and then deleted"""
        # Login the user
        self.client.force_authenticate(user=self.user)
        
        # Create bookmark
        create_response = self.client.post(self.create_url, {'coin_id': 'bitcoin'})
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        
        # Delete bookmark
        delete_response = self.client.delete(self.delete_url)
        self.assertEqual(delete_response.status_code, status.HTTP_200_OK)
        
        # Try to delete again - should return 404
        delete_again_response = self.client.delete(self.delete_url)
        self.assertEqual(delete_again_response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(delete_again_response.data['error'], 'ブックマークが見つかりません')