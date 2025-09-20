"""
Tests for login API endpoint
"""
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from ..models import User


class LoginAPITestCase(TestCase):
    """Test cases for login API"""
    
    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        self.login_url = reverse('login')
        
        # Create a test user
        self.test_user = User.objects.create_user(
            email='test@example.com',
            name='Test User',
            password='testpass123'
        )
        
        self.valid_login_data = {
            'email': 'test@example.com',
            'password': 'testpass123'
        }
        
    def test_successful_login(self):
        """Test successful login with valid credentials"""
        response = self.client.post(self.login_url, self.valid_login_data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)
        self.assertEqual(response.data['message'], 'ログインが成功しました')
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['email'], 'test@example.com')
        self.assertEqual(response.data['user']['name'], 'Test User')
        
        # Check that last_login_at was updated
        self.test_user.refresh_from_db()
        self.assertIsNotNone(self.test_user.last_login_at)
        
    def test_login_with_nonexistent_email(self):
        """Test login with email that doesn't exist"""
        invalid_data = {
            'email': 'nonexistent@example.com',
            'password': 'testpass123'
        }
        
        response = self.client.post(self.login_url, invalid_data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('errors', response.data)
        self.assertIn('存在しないemailです', str(response.data['errors']))
        
    def test_login_with_wrong_password(self):
        """Test login with correct email but wrong password"""
        invalid_data = {
            'email': 'test@example.com',
            'password': 'wrongpassword'
        }
        
        response = self.client.post(self.login_url, invalid_data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('errors', response.data)
        self.assertIn('パスワードが正しくありません', str(response.data['errors']))
        
    def test_login_with_missing_email(self):
        """Test login with missing email field"""
        invalid_data = {
            'password': 'testpass123'
        }
        
        response = self.client.post(self.login_url, invalid_data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('errors', response.data)
        
    def test_login_with_missing_password(self):
        """Test login with missing password field"""
        invalid_data = {
            'email': 'test@example.com'
        }
        
        response = self.client.post(self.login_url, invalid_data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('errors', response.data)
        
    def test_login_with_empty_data(self):
        """Test login with empty data"""
        response = self.client.post(self.login_url, {})
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('errors', response.data)
        
    def test_last_login_at_update(self):
        """Test that last_login_at field is properly updated"""
        # Ensure last_login_at is initially None
        self.test_user.last_login_at = None
        self.test_user.save()
        
        # Record the time before login
        before_login = timezone.now()
        
        response = self.client.post(self.login_url, self.valid_login_data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check that last_login_at was updated
        self.test_user.refresh_from_db()
        self.assertIsNotNone(self.test_user.last_login_at)
        self.assertGreaterEqual(self.test_user.last_login_at, before_login)
        
    def test_session_creation(self):
        """Test that a session is created after successful login"""
        response = self.client.post(self.login_url, self.valid_login_data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check that session was created
        self.assertIn('sessionid', self.client.cookies)