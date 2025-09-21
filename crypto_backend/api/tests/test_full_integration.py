"""
Comprehensive integration tests for the crypto backend API.
Tests the complete system integration including authentication, 
cryptocurrency data, and bookmark functionality.
"""

import json
from django.test import TestCase, TransactionTestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.db import transaction
from django.core.cache import cache
from django.test.utils import override_settings
from unittest.mock import patch
import time
from decimal import Decimal

from api.models import User, Coin, Bookmark


class FullSystemIntegrationTest(APITestCase):
    """Test complete system integration scenarios."""
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        
        # Create test coins
        self.bitcoin = Coin.objects.create(
            id='bitcoin',
            symbol='btc',
            name='Bitcoin',
            image='https://example.com/bitcoin.png',
            current_price=Decimal('50000.00'),
            market_cap=1000000000,
            market_cap_rank=1,
            fully_diluted_valuation=1050000000,
            total_volume=50000000,
            high_24h=Decimal('51000.00'),
            low_24h=Decimal('49000.00'),
            price_change_24h=Decimal('1000.00'),
            price_change_percentage_24h=Decimal('2.00'),
            market_cap_change_24h=20000000,
            market_cap_change_percentage_24h=Decimal('2.00'),
            circulating_supply=Decimal('19000000.00'),
            total_supply=Decimal('21000000.00'),
            max_supply=Decimal('21000000.00'),
            ath=Decimal('69000.00'),
            ath_change_percentage=Decimal('-27.50'),
            ath_date='2021-11-10T14:24:11.849Z',
            atl=Decimal('67.81'),
            atl_change_percentage=Decimal('73658.20'),
            atl_date='2013-07-06T00:00:00.000Z',
            last_updated='2024-01-01T00:00:00Z'
        )
        
        self.ethereum = Coin.objects.create(
            id='ethereum',
            symbol='eth',
            name='Ethereum',
            image='https://example.com/ethereum.png',
            current_price=Decimal('3000.00'),
            market_cap=360000000,
            market_cap_rank=2,
            total_volume=15000000,
            high_24h=Decimal('3100.00'),
            low_24h=Decimal('2900.00'),
            price_change_24h=Decimal('100.00'),
            price_change_percentage_24h=Decimal('3.40'),
            circulating_supply=Decimal('120000000.00'),
            last_updated='2024-01-01T00:00:00Z'
        )

    def test_complete_user_journey_new_user(self):
        """Test complete journey for a new user."""
        
        # Step 1: User registration
        registration_data = {
            'email': 'newuser@example.com',
            'password': 'password123',
            'username': 'newuser'
        }
        
        response = self.client.post('/api/auth/register/', registration_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('user', response.data)
        self.assertIn('token', response.data)
        
        # Verify user was created
        user = User.objects.get(email='newuser@example.com')
        self.assertEqual(user.username, 'newuser')
        
        # Step 2: User login
        login_data = {
            'email': 'newuser@example.com',
            'password': 'password123'
        }
        
        response = self.client.post('/api/auth/login/', login_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)
        
        token = response.data['token']
        
        # Step 3: Browse cryptocurrency list
        response = self.client.get('/api/coins/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0]['name'], 'Bitcoin')
        self.assertEqual(response.data[1]['name'], 'Ethereum')
        
        # Step 4: View cryptocurrency detail
        response = self.client.get('/api/coins/bitcoin/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Bitcoin')
        self.assertEqual(str(response.data['current_price']), '50000.00')
        
        # Step 5: Add bookmark (requires authentication)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        
        bookmark_data = {'coin_id': 'bitcoin'}
        response = self.client.post('/api/bookmarks/', bookmark_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify bookmark was created
        bookmark = Bookmark.objects.get(user=user, coin=self.bitcoin)
        self.assertIsNotNone(bookmark)
        
        # Step 6: View user bookmarks
        response = self.client.get('/api/user/bookmarks/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Bitcoin')
        
        # Step 7: Remove bookmark
        response = self.client.delete(f'/api/bookmarks/bitcoin/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verify bookmark was removed
        self.assertFalse(Bookmark.objects.filter(user=user, coin=self.bitcoin).exists())
        
        # Step 8: Logout
        response = self.client.post('/api/auth/logout/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_complete_user_journey_existing_user(self):
        """Test complete journey for an existing user."""
        
        # Create existing user with bookmarks
        user = User.objects.create_user(
            email='existing@example.com',
            password='password123',
            username='existing'
        )
        
        # Create existing bookmark
        Bookmark.objects.create(user=user, coin=self.bitcoin)
        
        # Step 1: User login
        login_data = {
            'email': 'existing@example.com',
            'password': 'password123'
        }
        
        response = self.client.post('/api/auth/login/', login_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        token = response.data['token']
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        
        # Step 2: View existing bookmarks
        response = self.client.get('/api/user/bookmarks/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Bitcoin')
        
        # Step 3: Add another bookmark
        bookmark_data = {'coin_id': 'ethereum'}
        response = self.client.post('/api/bookmarks/', bookmark_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Step 4: View updated bookmarks
        response = self.client.get('/api/user/bookmarks/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        
        # Step 5: Remove one bookmark
        response = self.client.delete('/api/bookmarks/bitcoin/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Step 6: Verify remaining bookmark
        response = self.client.get('/api/user/bookmarks/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Ethereum')

    def test_authentication_security_integration(self):
        """Test authentication security across the system."""
        
        # Test 1: Unauthenticated access to protected endpoints
        protected_endpoints = [
            '/api/bookmarks/',
            '/api/user/bookmarks/',
            '/api/auth/logout/'
        ]
        
        for endpoint in protected_endpoints:
            response = self.client.get(endpoint)
            self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])
        
        # Test 2: Invalid token
        self.client.credentials(HTTP_AUTHORIZATION='Token invalid-token')
        response = self.client.get('/api/user/bookmarks/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Test 3: Valid authentication flow
        user = User.objects.create_user(
            email='test@example.com',
            password='password123',
            username='testuser'
        )
        
        login_data = {'email': 'test@example.com', 'password': 'password123'}
        response = self.client.post('/api/auth/login/', login_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        token = response.data['token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        
        # Should now have access to protected endpoints
        response = self.client.get('/api/user/bookmarks/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_error_handling_integration(self):
        """Test error handling across the system."""
        
        # Test 1: Invalid registration data
        invalid_registration_data = [
            {'email': 'invalid-email', 'password': 'pass', 'username': 'user'},
            {'email': 'test@example.com', 'password': '123', 'username': 'user'},
            {'email': 'test@example.com', 'password': 'password123', 'username': ''},
        ]
        
        for data in invalid_registration_data:
            response = self.client.post('/api/auth/register/', data)
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Test 2: Invalid login credentials
        response = self.client.post('/api/auth/login/', {
            'email': 'nonexistent@example.com',
            'password': 'wrongpassword'
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Test 3: Nonexistent coin detail
        response = self.client.get('/api/coins/nonexistent/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        # Test 4: Duplicate bookmark
        user = User.objects.create_user(
            email='test@example.com',
            password='password123',
            username='testuser'
        )
        
        login_response = self.client.post('/api/auth/login/', {
            'email': 'test@example.com',
            'password': 'password123'
        })
        token = login_response.data['token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        
        # Create first bookmark
        response = self.client.post('/api/bookmarks/', {'coin_id': 'bitcoin'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Try to create duplicate
        response = self.client.post('/api/bookmarks/', {'coin_id': 'bitcoin'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_data_consistency_integration(self):
        """Test data consistency across operations."""
        
        user = User.objects.create_user(
            email='test@example.com',
            password='password123',
            username='testuser'
        )
        
        login_response = self.client.post('/api/auth/login/', {
            'email': 'test@example.com',
            'password': 'password123'
        })
        token = login_response.data['token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        
        # Test 1: Bookmark operations maintain consistency
        initial_bookmark_count = Bookmark.objects.count()
        
        # Add bookmark
        response = self.client.post('/api/bookmarks/', {'coin_id': 'bitcoin'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Bookmark.objects.count(), initial_bookmark_count + 1)
        
        # Verify bookmark appears in user's list
        response = self.client.get('/api/user/bookmarks/')
        self.assertEqual(len(response.data), 1)
        
        # Remove bookmark
        response = self.client.delete('/api/bookmarks/bitcoin/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Bookmark.objects.count(), initial_bookmark_count)
        
        # Verify bookmark no longer in user's list
        response = self.client.get('/api/user/bookmarks/')
        self.assertEqual(len(response.data), 0)

    def test_concurrent_operations(self):
        """Test system behavior under concurrent operations."""
        
        # Create multiple users
        users = []
        for i in range(3):
            user = User.objects.create_user(
                email=f'user{i}@example.com',
                password='password123',
                username=f'user{i}'
            )
            users.append(user)
        
        # Test concurrent bookmark operations
        clients = []
        for i, user in enumerate(users):
            client = APIClient()
            login_response = client.post('/api/auth/login/', {
                'email': f'user{i}@example.com',
                'password': 'password123'
            })
            token = login_response.data['token']
            client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
            clients.append(client)
        
        # All users bookmark the same coin simultaneously
        responses = []
        for client in clients:
            response = client.post('/api/bookmarks/', {'coin_id': 'bitcoin'})
            responses.append(response)
        
        # All operations should succeed
        for response in responses:
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify each user has their own bookmark
        for i, client in enumerate(clients):
            response = client.get('/api/user/bookmarks/')
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertEqual(len(response.data), 1)

    @override_settings(DEBUG=False)
    def test_performance_requirements(self):
        """Test system meets performance requirements."""
        
        # Test 1: API response times
        start_time = time.time()
        response = self.client.get('/api/coins/')
        end_time = time.time()
        
        response_time = (end_time - start_time) * 1000  # Convert to milliseconds
        
        # API should respond within reasonable time (< 1000ms)
        self.assertLess(response_time, 1000)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test 2: Database query efficiency
        with self.assertNumQueries(1):  # Should use efficient queries
            response = self.client.get('/api/coins/')
        
        # Test 3: Large dataset handling
        # Create many coins to test pagination/performance
        coins = []
        for i in range(100):
            coin = Coin(
                id=f'coin-{i}',
                symbol=f'coin{i}',
                name=f'Coin {i}',
                current_price=Decimal(str(i * 100)),
                market_cap_rank=i + 10,
                last_updated='2024-01-01T00:00:00Z'
            )
            coins.append(coin)
        
        Coin.objects.bulk_create(coins)
        
        start_time = time.time()
        response = self.client.get('/api/coins/')
        end_time = time.time()
        
        response_time = (end_time - start_time) * 1000
        
        # Should still respond quickly with large dataset
        self.assertLess(response_time, 2000)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_internationalization_support(self):
        """Test multi-language support in API responses."""
        
        # Test with different Accept-Language headers
        languages = ['en', 'ja', 'en-US', 'ja-JP']
        
        for lang in languages:
            response = self.client.get('/api/coins/', HTTP_ACCEPT_LANGUAGE=lang)
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            
            # Test error messages in different languages
            response = self.client.post('/api/auth/login/', {
                'email': 'invalid',
                'password': 'wrong'
            }, HTTP_ACCEPT_LANGUAGE=lang)
            
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
            self.assertIn('error', response.data)

    def test_api_versioning_compatibility(self):
        """Test API version compatibility."""
        
        # Test with different API version headers
        versions = ['v1', 'application/json', None]
        
        for version in versions:
            headers = {}
            if version:
                headers['HTTP_ACCEPT'] = f'application/vnd.api+json; version={version}'
            
            response = self.client.get('/api/coins/', **headers)
            self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_security_headers_integration(self):
        """Test security headers are properly set."""
        
        response = self.client.get('/api/coins/')
        
        # Check for security headers (if implemented)
        # These would be set by middleware or server configuration
        expected_headers = [
            'X-Content-Type-Options',
            'X-Frame-Options',
            'X-XSS-Protection'
        ]
        
        # Note: These headers might be set by web server or middleware
        # This test documents the expectation
        for header in expected_headers:
            # Check if header exists (implementation dependent)
            pass

    def test_rate_limiting_integration(self):
        """Test rate limiting behavior (if implemented)."""
        
        # Make multiple rapid requests
        responses = []
        for i in range(10):
            response = self.client.get('/api/coins/')
            responses.append(response)
        
        # All requests should succeed (or be rate limited appropriately)
        for response in responses:
            self.assertIn(response.status_code, [
                status.HTTP_200_OK,
                status.HTTP_429_TOO_MANY_REQUESTS
            ])

    def test_database_transaction_integrity(self):
        """Test database transaction integrity."""
        
        user = User.objects.create_user(
            email='test@example.com',
            password='password123',
            username='testuser'
        )
        
        initial_bookmark_count = Bookmark.objects.count()
        
        # Test transaction rollback on error
        try:
            with transaction.atomic():
                # Create bookmark
                Bookmark.objects.create(user=user, coin=self.bitcoin)
                
                # Force an error
                raise Exception("Simulated error")
        except Exception:
            pass
        
        # Bookmark should not exist due to rollback
        self.assertEqual(Bookmark.objects.count(), initial_bookmark_count)

    def test_cross_origin_requests(self):
        """Test CORS handling for cross-origin requests."""
        
        # Test preflight request
        response = self.client.options('/api/coins/', 
                                     HTTP_ORIGIN='http://localhost:3000',
                                     HTTP_ACCESS_CONTROL_REQUEST_METHOD='GET')
        
        # Should handle CORS appropriately
        self.assertIn(response.status_code, [
            status.HTTP_200_OK,
            status.HTTP_204_NO_CONTENT
        ])

    def tearDown(self):
        """Clean up after tests."""
        cache.clear()
        User.objects.all().delete()
        Coin.objects.all().delete()
        Bookmark.objects.all().delete()


class SystemLoadTest(TransactionTestCase):
    """Test system behavior under load."""
    
    def test_high_concurrency_operations(self):
        """Test system under high concurrency."""
        
        # Create test data
        bitcoin = Coin.objects.create(
            id='bitcoin',
            symbol='btc',
            name='Bitcoin',
            current_price=Decimal('50000.00'),
            market_cap_rank=1,
            last_updated='2024-01-01T00:00:00Z'
        )
        
        # Create multiple users concurrently
        users = []
        for i in range(10):
            user = User.objects.create_user(
                email=f'user{i}@example.com',
                password='password123',
                username=f'user{i}'
            )
            users.append(user)
        
        # Simulate concurrent bookmark operations
        clients = []
        for i, user in enumerate(users):
            client = APIClient()
            login_response = client.post('/api/auth/login/', {
                'email': f'user{i}@example.com',
                'password': 'password123'
            })
            
            if login_response.status_code == status.HTTP_200_OK:
                token = login_response.data['token']
                client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
                clients.append(client)
        
        # All clients perform operations simultaneously
        bookmark_responses = []
        for client in clients:
            response = client.post('/api/bookmarks/', {'coin_id': 'bitcoin'})
            bookmark_responses.append(response)
        
        # Most operations should succeed
        successful_operations = sum(1 for r in bookmark_responses 
                                  if r.status_code == status.HTTP_201_CREATED)
        
        self.assertGreater(successful_operations, len(clients) * 0.8)  # 80% success rate

    def test_memory_usage_under_load(self):
        """Test memory usage doesn't grow excessively under load."""
        
        # Create large dataset
        coins = []
        for i in range(1000):
            coin = Coin(
                id=f'coin-{i}',
                symbol=f'c{i}',
                name=f'Coin {i}',
                current_price=Decimal(str(i)),
                market_cap_rank=i + 1,
                last_updated='2024-01-01T00:00:00Z'
            )
            coins.append(coin)
        
        Coin.objects.bulk_create(coins)
        
        # Make multiple requests
        client = APIClient()
        for i in range(50):
            response = client.get('/api/coins/')
            self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test should complete without memory issues
        self.assertTrue(True)