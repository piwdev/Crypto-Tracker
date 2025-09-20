from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from ..models import User


class LogoutTestCase(TestCase):
    """Test cases for logout functionality"""
    
    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        self.user_data = {
            'email': 'test@example.com',
            'name': 'Test User',
            'password': 'testpass123'
        }
        
        # Create a test user
        self.user = User.objects.create_user(
            email=self.user_data['email'],
            name=self.user_data['name'],
            password=self.user_data['password']
        )
        
        self.logout_url = reverse('logout')
        self.login_url = reverse('login')
    
    def test_logout_authenticated_user(self):
        """Test logout with authenticated user"""
        # First login the user
        login_response = self.client.post(self.login_url, {
            'email': self.user_data['email'],
            'password': self.user_data['password']
        })
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        
        # Verify user is authenticated
        self.assertTrue(self.client.session.get('_auth_user_id'))
        
        # Now logout
        logout_response = self.client.post(self.logout_url)
        
        # Check response
        self.assertEqual(logout_response.status_code, status.HTTP_200_OK)
        self.assertEqual(logout_response.data['message'], 'ログアウトが完了しました')
        
        # Verify user is no longer authenticated
        self.assertIsNone(self.client.session.get('_auth_user_id'))
    
    def test_logout_unauthenticated_user(self):
        """Test logout with unauthenticated user"""
        logout_response = self.client.post(self.logout_url)
        
        # Check response
        self.assertEqual(logout_response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(logout_response.data['error'], 'ユーザーがログインしていません')
    
    def test_logout_method_not_allowed(self):
        """Test logout with GET method (should only accept POST)"""
        # First login the user
        login_response = self.client.post(self.login_url, {
            'email': self.user_data['email'],
            'password': self.user_data['password']
        })
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        
        # Try GET request to logout endpoint
        logout_response = self.client.get(self.logout_url)
        
        # Should return method not allowed
        self.assertEqual(logout_response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
    
    def test_logout_session_invalidation(self):
        """Test that logout properly invalidates the session"""
        # Login the user
        login_response = self.client.post(self.login_url, {
            'email': self.user_data['email'],
            'password': self.user_data['password']
        })
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        
        # Store session key before logout
        session_key_before = self.client.session.session_key
        
        # Logout
        logout_response = self.client.post(self.logout_url)
        self.assertEqual(logout_response.status_code, status.HTTP_200_OK)
        
        # Verify session is cleared
        self.assertIsNone(self.client.session.get('_auth_user_id'))
        
        # Try to access a protected endpoint (if we had one)
        # For now, just verify the session is cleared
        self.assertFalse(self.client.session.get('_auth_user_id'))