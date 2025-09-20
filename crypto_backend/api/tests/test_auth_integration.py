"""
Integration tests for authentication flow (registration + login)
"""
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from ..models import User


class AuthIntegrationTestCase(TestCase):
    """Test cases for authentication integration"""
    
    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        self.register_url = reverse('register')
        self.login_url = reverse('login')
        
        self.user_data = {
            'email': 'integration@example.com',
            'name': 'IntegrationUser',
            'password': 'testpass123'
        }
        
    def test_register_then_login_flow(self):
        """Test complete registration and login flow"""
        # Step 1: Register a new user
        register_response = self.client.post(self.register_url, self.user_data)
        
        self.assertEqual(register_response.status_code, status.HTTP_201_CREATED)
        self.assertIn('message', register_response.data)
        self.assertEqual(register_response.data['message'], 'ユーザー登録が完了しました')
        
        # Verify user was created in database
        user = User.objects.get(email=self.user_data['email'])
        self.assertEqual(user.name, self.user_data['name'])
        self.assertIsNone(user.last_login_at)  # Should be None initially
        
        # Step 2: Login with the registered user
        login_data = {
            'email': self.user_data['email'],
            'password': self.user_data['password']
        }
        
        login_response = self.client.post(self.login_url, login_data)
        
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        self.assertIn('message', login_response.data)
        self.assertEqual(login_response.data['message'], 'ログインが成功しました')
        self.assertIn('user', login_response.data)
        self.assertEqual(login_response.data['user']['email'], self.user_data['email'])
        self.assertEqual(login_response.data['user']['name'], self.user_data['name'])
        
        # Verify last_login_at was updated
        user.refresh_from_db()
        self.assertIsNotNone(user.last_login_at)
        
        # Verify session was created
        self.assertIn('sessionid', self.client.cookies)
        
    def test_login_before_registration(self):
        """Test login attempt with non-existent user"""
        login_data = {
            'email': 'nonexistent@example.com',
            'password': 'somepassword'
        }
        
        response = self.client.post(self.login_url, login_data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('errors', response.data)
        self.assertIn('存在しないemailです', str(response.data['errors']))
        
    def test_multiple_login_attempts(self):
        """Test multiple login attempts update last_login_at each time"""
        # Register user first
        self.client.post(self.register_url, self.user_data)
        
        login_data = {
            'email': self.user_data['email'],
            'password': self.user_data['password']
        }
        
        # First login
        response1 = self.client.post(self.login_url, login_data)
        self.assertEqual(response1.status_code, status.HTTP_200_OK)
        
        user = User.objects.get(email=self.user_data['email'])
        first_login_time = user.last_login_at
        
        # Second login (after a small delay simulation)
        import time
        time.sleep(0.001)  # Small delay to ensure different timestamps
        
        response2 = self.client.post(self.login_url, login_data)
        self.assertEqual(response2.status_code, status.HTTP_200_OK)
        
        user.refresh_from_db()
        second_login_time = user.last_login_at
        
        # Verify last_login_at was updated
        self.assertGreater(second_login_time, first_login_time)