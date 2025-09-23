"""
Tests for the cryptocurrency list API endpoint
"""
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from api.models import Coin


class CoinListAPITest(TestCase):
    """Test cases for the coin list API endpoint"""

    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        self.url = reverse('conin_top10_list')
        
        # Create test coins with various market cap ranks
        test_coins = [
            {'id': 'bitcoin', 'symbol': 'btc', 'name': 'Bitcoin', 'market_cap_rank': 1, 'current_price': 50000, 'high_24h': 51000, 'price_change_percentage_24h': 2.5, 'market_cap': 1000000000000, 'image': 'https://example.com/bitcoin.png'},
            {'id': 'ethereum', 'symbol': 'eth', 'name': 'Ethereum', 'market_cap_rank': 2, 'current_price': 3000, 'high_24h': 3100, 'price_change_percentage_24h': 1.8, 'market_cap': 500000000000, 'image': 'https://example.com/ethereum.png'},
            {'id': 'binancecoin', 'symbol': 'bnb', 'name': 'BNB', 'market_cap_rank': 3, 'current_price': 400, 'high_24h': 410, 'price_change_percentage_24h': -0.5, 'market_cap': 100000000000, 'image': 'https://example.com/bnb.png'},
            {'id': 'solana', 'symbol': 'sol', 'name': 'Solana', 'market_cap_rank': 4, 'current_price': 100, 'high_24h': 105, 'price_change_percentage_24h': 3.2, 'market_cap': 50000000000, 'image': 'https://example.com/solana.png'},
            {'id': 'cardano', 'symbol': 'ada', 'name': 'Cardano', 'market_cap_rank': 5, 'current_price': 0.5, 'high_24h': 0.52, 'price_change_percentage_24h': 1.1, 'market_cap': 20000000000, 'image': 'https://example.com/cardano.png'},
            {'id': 'ripple', 'symbol': 'xrp', 'name': 'XRP', 'market_cap_rank': 6, 'current_price': 0.6, 'high_24h': 0.62, 'price_change_percentage_24h': -1.2, 'market_cap': 30000000000, 'image': 'https://example.com/xrp.png'},
            {'id': 'polkadot', 'symbol': 'dot', 'name': 'Polkadot', 'market_cap_rank': 7, 'current_price': 8, 'high_24h': 8.5, 'price_change_percentage_24h': 2.8, 'market_cap': 15000000000, 'image': 'https://example.com/polkadot.png'},
            {'id': 'dogecoin', 'symbol': 'doge', 'name': 'Dogecoin', 'market_cap_rank': 8, 'current_price': 0.08, 'high_24h': 0.085, 'price_change_percentage_24h': 5.2, 'market_cap': 12000000000, 'image': 'https://example.com/dogecoin.png'},
            {'id': 'avalanche-2', 'symbol': 'avax', 'name': 'Avalanche', 'market_cap_rank': 9, 'current_price': 25, 'high_24h': 26, 'price_change_percentage_24h': 1.5, 'market_cap': 10000000000, 'image': 'https://example.com/avalanche.png'},
            {'id': 'chainlink', 'symbol': 'link', 'name': 'Chainlink', 'market_cap_rank': 10, 'current_price': 15, 'high_24h': 15.5, 'price_change_percentage_24h': 0.8, 'market_cap': 8000000000, 'image': 'https://example.com/chainlink.png'},
            # Coins outside the 1-10 range (should be excluded)
            {'id': 'litecoin', 'symbol': 'ltc', 'name': 'Litecoin', 'market_cap_rank': 11, 'current_price': 80, 'high_24h': 82, 'price_change_percentage_24h': 1.2, 'market_cap': 6000000000, 'image': 'https://example.com/litecoin.png'},
            {'id': 'unranked-coin', 'symbol': 'unk', 'name': 'Unranked Coin', 'market_cap_rank': None, 'current_price': 1, 'high_24h': 1.1, 'price_change_percentage_24h': 0.1, 'market_cap': 1000000, 'image': 'https://example.com/unranked.png'},
        ]
        
        for coin_data in test_coins:
            coin_data['last_updated'] = timezone.now()
            Coin.objects.create(**coin_data)

    def test_conin_top10_list_success(self):
        """Test successful retrieval of coin list"""
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('data', response.data)
        self.assertIn('count', response.data)
        
        # Should return exactly 10 coins (ranks 1-10)
        self.assertEqual(response.data['count'], 10)
        self.assertEqual(len(response.data['data']), 10)

    def test_conin_top10_list_filtering(self):
        """Test that only coins with market_cap_rank 1-10 are returned"""
        response = self.client.get(self.url)
        
        coins = response.data['data']
        
        # All coins should have market_cap_rank between 1 and 10
        for coin in coins:
            self.assertGreaterEqual(coin['market_cap_rank'], 1)
            self.assertLessEqual(coin['market_cap_rank'], 10)

    def test_conin_top10_list_ordering(self):
        """Test that coins are ordered by market_cap_rank ascending"""
        response = self.client.get(self.url)
        
        coins = response.data['data']
        
        # Check that coins are ordered by market_cap_rank (1, 2, 3, ..., 10)
        for i, coin in enumerate(coins):
            expected_rank = i + 1
            self.assertEqual(coin['market_cap_rank'], expected_rank)

    def test_conin_top10_list_required_fields(self):
        """Test that response contains all required fields"""
        response = self.client.get(self.url)
        
        coins = response.data['data']
        required_fields = [
            'id', 'market_cap_rank', 'image', 'name', 
            'current_price', 'high_24h', 'price_change_percentage_24h', 'market_cap'
        ]
        
        for coin in coins:
            for field in required_fields:
                self.assertIn(field, coin)

    def test_conin_top10_list_no_extra_fields(self):
        """Test that response doesn't contain extra fields"""
        response = self.client.get(self.url)
        
        coins = response.data['data']
        expected_fields = {
            'id', 'market_cap_rank', 'image', 'name', 
            'current_price', 'high_24h', 'price_change_percentage_24h', 'market_cap'
        }
        
        for coin in coins:
            actual_fields = set(coin.keys())
            self.assertEqual(actual_fields, expected_fields)

    def test_conin_top10_list_empty_database(self):
        """Test response when no coins exist in database"""
        # Delete all coins
        Coin.objects.all().delete()
        
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 0)
        self.assertEqual(len(response.data['data']), 0)

    def test_conin_top10_list_method_not_allowed(self):
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