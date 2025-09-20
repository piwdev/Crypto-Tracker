"""
Tests for the cryptocurrency detail API endpoint
"""
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from api.models import Coin


class CoinDetailAPITest(TestCase):
    """Test cases for the coin detail API endpoint"""

    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        
        # Create a test coin with some basic fields (avoiding problematic decimal precision)
        self.test_coin = Coin.objects.create(
            id='bitcoin',
            symbol='btc',
            name='Bitcoin',
            image='https://example.com/bitcoin.png',
            current_price=50000,
            market_cap=1000000000000,
            market_cap_rank=1,
            high_24h=51000,
            price_change_percentage_24h=2.5,
            roi={"times": 100.5, "currency": "usd", "percentage": 10050.2},
            last_updated=timezone.now()
        )
        
        self.url = reverse('coin_detail', kwargs={'coin_id': 'bitcoin'})
        self.nonexistent_url = reverse('coin_detail', kwargs={'coin_id': 'nonexistent-coin'})

    def test_coin_detail_success(self):
        """Test successful retrieval of coin detail"""
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('data', response.data)
        
        coin_data = response.data['data']
        
        # Verify that all fields are present
        expected_fields = [
            'id', 'symbol', 'name', 'image', 'current_price', 'market_cap',
            'market_cap_rank', 'fully_diluted_valuation', 'total_volume',
            'high_24h', 'low_24h', 'price_change_24h', 'price_change_percentage_24h',
            'market_cap_change_24h', 'market_cap_change_percentage_24h',
            'circulating_supply', 'total_supply', 'max_supply', 'ath',
            'ath_change_percentage', 'ath_date', 'atl', 'atl_change_percentage',
            'atl_date', 'roi', 'last_updated', 'created_at', 'updated_at'
        ]
        
        for field in expected_fields:
            self.assertIn(field, coin_data)
        
        # Verify specific field values
        self.assertEqual(coin_data['id'], 'bitcoin')
        self.assertEqual(coin_data['symbol'], 'btc')
        self.assertEqual(coin_data['name'], 'Bitcoin')
        self.assertEqual(coin_data['market_cap_rank'], 1)

    def test_coin_detail_nonexistent_coin(self):
        """Test response when coin_id doesn't exist"""
        response = self.client.get(self.nonexistent_url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn('error', response.data)
        self.assertEqual(response.data['error'], 'コインが見つかりません')

    def test_coin_detail_all_fields_returned(self):
        """Test that all fields from the coins table are returned"""
        response = self.client.get(self.url)
        
        coin_data = response.data['data']
        
        # Check that we have all the fields that exist in the model
        # This ensures requirement 5.1 is met (all columns from coins table)
        model_fields = [field.name for field in Coin._meta.fields]
        
        for field in model_fields:
            self.assertIn(field, coin_data, f"Field '{field}' missing from response")

    def test_coin_detail_decimal_precision(self):
        """Test that decimal fields maintain proper precision"""
        response = self.client.get(self.url)
        
        coin_data = response.data['data']
        
        # Check that decimal values are properly serialized (can be string or None for optional fields)
        if coin_data['current_price'] is not None:
            self.assertIsInstance(coin_data['current_price'], str)
        if coin_data['high_24h'] is not None:
            self.assertIsInstance(coin_data['high_24h'], str)

    def test_coin_detail_json_field(self):
        """Test that JSON fields are properly serialized"""
        response = self.client.get(self.url)
        
        coin_data = response.data['data']
        
        # Check that ROI JSON field is properly returned
        self.assertIsInstance(coin_data['roi'], dict)
        self.assertIn('times', coin_data['roi'])
        self.assertIn('currency', coin_data['roi'])
        self.assertIn('percentage', coin_data['roi'])

    def test_coin_detail_method_not_allowed(self):
        """Test that only GET method is allowed"""
        # Test POST method
        response = self.client.post(self.url, {})
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        
        # Test PUT method
        response = self.client.put(self.url, {})
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        
        # Test DELETE method
        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_coin_detail_empty_optional_fields(self):
        """Test coin detail with empty optional fields"""
        # Create a coin with minimal data
        minimal_coin = Coin.objects.create(
            id='minimal-coin',
            symbol='min',
            name='Minimal Coin',
            last_updated=timezone.now()
        )
        
        url = reverse('coin_detail', kwargs={'coin_id': 'minimal-coin'})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        coin_data = response.data['data']
        self.assertEqual(coin_data['id'], 'minimal-coin')
        self.assertEqual(coin_data['symbol'], 'min')
        self.assertEqual(coin_data['name'], 'Minimal Coin')
        
        # Optional fields should be null
        self.assertIsNone(coin_data['current_price'])
        self.assertIsNone(coin_data['market_cap'])
        self.assertIsNone(coin_data['roi'])