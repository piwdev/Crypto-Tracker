from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from ..models import User
import json


class UserRegistrationTestCase(TestCase):
    """
    Test cases for user registration API
    """
    
    def setUp(self):
        self.client = APIClient()
        self.register_url = reverse('register')
        
    def test_successful_registration(self):
        """
        Test successful user registration with valid data
        """
        data = {
            'email': 'test@example.com',
            'name': 'TestUser',
            'password': 'test123'
        }
        
        response = self.client.post(self.register_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('message', response.data)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['email'], 'test@example.com')
        self.assertEqual(response.data['user']['name'], 'TestUser')
        
        # Verify user was created in database
        self.assertTrue(User.objects.filter(email='test@example.com').exists())
    
    def test_duplicate_email_registration(self):
        """
        Test registration with duplicate email
        """
        # Create a user first
        User.objects.create_user(
            email='existing@example.com',
            name='ExistingUser',
            password='password123'
        )
        
        # Try to register with same email
        data = {
            'email': 'existing@example.com',
            'name': 'NewUser',
            'password': 'newpass123'
        }
        
        response = self.client.post(self.register_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('errors', response.data)
        self.assertIn('email', response.data['errors'])
        self.assertEqual(response.data['errors']['email'][0], '既に登録されているメールアドレスです')
    
    def test_invalid_email_format(self):
        """
        Test registration with invalid email format
        """
        data = {
            'email': 'invalid-email',
            'name': 'TestUser',
            'password': 'test123'
        }
        
        response = self.client.post(self.register_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('errors', response.data)
        self.assertIn('email', response.data['errors'])
    
    def test_invalid_password_format(self):
        """
        Test registration with invalid password format
        """
        # Test password with special characters
        data = {
            'email': 'test@example.com',
            'name': 'TestUser',
            'password': 'test@123!'
        }
        
        response = self.client.post(self.register_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('errors', response.data)
        self.assertIn('password', response.data['errors'])
        self.assertEqual(response.data['errors']['password'][0], 'パスワードはアルファベットと数字のみで構成してください')
    
    def test_password_length_validation(self):
        """
        Test password length validation
        """
        # Test password too short
        data = {
            'email': 'test@example.com',
            'name': 'TestUser',
            'password': '123'
        }
        
        response = self.client.post(self.register_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('errors', response.data)
        self.assertIn('password', response.data['errors'])
        self.assertEqual(response.data['errors']['password'][0], 'パスワードは4-20文字で入力してください')
        
        # Test password too long
        data['password'] = 'a' * 21
        response = self.client.post(self.register_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('errors', response.data)
        self.assertIn('password', response.data['errors'])
        self.assertEqual(response.data['errors']['password'][0], 'パスワードは4-20文字で入力してください')
    
    def test_invalid_name_format(self):
        """
        Test registration with invalid name format
        """
        # Test name with numbers
        data = {
            'email': 'test@example.com',
            'name': 'TestUser123',
            'password': 'test123'
        }
        
        response = self.client.post(self.register_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('errors', response.data)
        self.assertIn('name', response.data['errors'])
        self.assertEqual(response.data['errors']['name'][0], '名前はアルファベットまたは日本語文字のみで構成してください')
    
    def test_name_length_validation(self):
        """
        Test name length validation
        """
        # Test name too long
        data = {
            'email': 'test@example.com',
            'name': 'a' * 21,
            'password': 'test123'
        }
        
        response = self.client.post(self.register_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('errors', response.data)
        self.assertIn('name', response.data['errors'])
        self.assertEqual(response.data['errors']['name'][0], '名前は1-20文字で入力してください')
    
    def test_japanese_name_validation(self):
        """
        Test registration with Japanese name
        """
        data = {
            'email': 'test@example.com',
            'name': '田中太郎',
            'password': 'test123'
        }
        
        response = self.client.post(self.register_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['user']['name'], '田中太郎')
    
    def test_missing_required_fields(self):
        """
        Test registration with missing required fields
        """
        data = {
            'email': 'test@example.com'
            # Missing name and password
        }
        
        response = self.client.post(self.register_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('errors', response.data)
        self.assertIn('name', response.data['errors'])
        self.assertIn('password', response.data['errors'])