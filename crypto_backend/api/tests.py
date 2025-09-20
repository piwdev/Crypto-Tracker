from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import IntegrityError

User = get_user_model()


class UserModelTest(TestCase):
    """
    Test cases for the custom User model
    """
    
    def test_create_user_with_email(self):
        """Test creating a user with email and name"""
        user = User.objects.create_user(
            email='test@example.com',
            name='Test User',
            password='testpass123'
        )
        
        self.assertEqual(user.email, 'test@example.com')
        self.assertEqual(user.name, 'Test User')
        self.assertTrue(user.check_password('testpass123'))
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        self.assertIsNotNone(user.created_at)
        self.assertIsNone(user.last_login_at)
    
    def test_create_superuser(self):
        """Test creating a superuser"""
        admin_user = User.objects.create_superuser(
            email='admin@example.com',
            name='Admin User',
            password='adminpass123'
        )
        
        self.assertEqual(admin_user.email, 'admin@example.com')
        self.assertEqual(admin_user.name, 'Admin User')
        self.assertTrue(admin_user.is_active)
        self.assertTrue(admin_user.is_staff)
        self.assertTrue(admin_user.is_superuser)
    
    def test_user_string_representation(self):
        """Test the string representation of user"""
        user = User(email='test@example.com', name='Test User')
        self.assertEqual(str(user), 'test@example.com')
    
    def test_email_uniqueness(self):
        """Test that email must be unique"""
        User.objects.create_user(
            email='test@example.com',
            name='Test User 1',
            password='testpass123'
        )
        
        with self.assertRaises(IntegrityError):
            User.objects.create_user(
                email='test@example.com',
                name='Test User 2',
                password='testpass456'
            )
    
    def test_username_field_is_email(self):
        """Test that USERNAME_FIELD is set to email"""
        self.assertEqual(User.USERNAME_FIELD, 'email')
    
    def test_required_fields(self):
        """Test that REQUIRED_FIELDS contains name"""
        self.assertEqual(User.REQUIRED_FIELDS, ['name'])
