import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { validation } from '../../utils/validation';
import ErrorMessage from '../common/ErrorMessage';
import LoadingSpinner from '../common/LoadingSpinner';
import './CreateAccountForm.css';

interface CreateAccountFormData {
  email: string;
  password: string;
  username: string;
}

interface CreateAccountFormErrors {
  email?: string;
  password?: string;
  username?: string;
}

export const CreateAccountForm: React.FC = () => {
  const { t } = useTranslation();
  const { register, loading, error, clearError, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<CreateAccountFormData>({
    email: '',
    password: '',
    username: '',
  });
  
  const [errors, setErrors] = useState<CreateAccountFormErrors>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

  // Redirect to home if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Clear auth error when component mounts or form data changes
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [formData, error, clearError]);

  // Handle input changes with real-time validation
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Real-time validation - validate as user types
    if (touched[name]) {
      validateField(name, value);
    }

    // Clear field error when user starts typing
    if (errors[name as keyof CreateAccountFormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  // Handle input blur for validation
  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true,
    }));
    validateField(name, formData[name as keyof CreateAccountFormData]);
  };

  // Validate individual field
  const validateField = (fieldName: string, value: string): string | undefined => {
    let error: string | undefined;

    switch (fieldName) {
      case 'email':
        if (!validation.isRequired(value)) {
          error = t('auth.emailRequired');
        } else if (!validation.isValidEmail(value)) {
          error = t('auth.invalidEmail');
        }
        break;
      case 'password':
        if (!validation.isRequired(value)) {
          error = t('auth.passwordRequired');
        } else if (!validation.isValidPassword(value)) {
          error = t('auth.invalidPassword');
        }
        break;
      case 'username':
        if (!validation.isRequired(value)) {
          error = t('auth.usernameRequired');
        } else if (!validation.isValidUsername(value)) {
          error = t('auth.invalidUsername');
        }
        break;
    }

    setErrors(prev => ({
      ...prev,
      [fieldName]: error,
    }));

    return error;
  };

  // Validate entire form
  const validateForm = (): boolean => {
    const newErrors: CreateAccountFormErrors = {};
    let isValid = true;

    // Validate email
    const emailError = validateField('email', formData.email);
    if (emailError) {
      newErrors.email = emailError;
      isValid = false;
    }

    // Validate password
    const passwordError = validateField('password', formData.password);
    if (passwordError) {
      newErrors.password = passwordError;
      isValid = false;
    }

    // Validate username
    const usernameError = validateField('username', formData.username);
    if (usernameError) {
      newErrors.username = usernameError;
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouched({
      email: true,
      password: true,
      username: true,
    });

    // Validate form
    if (!validateForm()) {
      return;
    }

    // Submit registration request
    try {
      await register({
        email: formData.email,
        password: formData.password,
        username: formData.username,
      });
      // Navigation will be handled by the auth context/routing
    } catch (error) {
      // Error is handled by the auth context
      console.error('Registration failed:', error);
    }
  };

  return (
    <div className="create-account-form-container">
      <div className="create-account-form-card">
        <h1 className="create-account-form-title">{t('auth.registerTitle')}</h1>
        
        {error && (
          <ErrorMessage 
            message={error} 
            onClose={clearError}
          />
        )}

        <form onSubmit={handleSubmit} className="create-account-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              {t('auth.email')}
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              className={`form-input ${errors.email ? 'form-input-error' : ''}`}
              placeholder={t('auth.email')}
              disabled={loading}
              autoComplete="email"
            />
            {touched.email && errors.email && (
              <span className="form-error">{errors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              {t('auth.password')}
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              className={`form-input ${errors.password ? 'form-input-error' : ''}`}
              placeholder={t('auth.password')}
              disabled={loading}
              autoComplete="new-password"
            />
            {touched.password && errors.password && (
              <span className="form-error">{errors.password}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="username" className="form-label">
              {t('auth.username')}
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              className={`form-input ${errors.username ? 'form-input-error' : ''}`}
              placeholder={t('auth.username')}
              disabled={loading}
              autoComplete="name"
            />
            {touched.username && errors.username && (
              <span className="form-error">{errors.username}</span>
            )}
          </div>

          <button
            type="submit"
            className="create-account-button"
            disabled={loading}
          >
            {loading ? <LoadingSpinner size="small" /> : t('auth.registerButton')}
          </button>
        </form>

        <div className="create-account-form-footer">
          <Link to="/login" className="login-link">
            {t('auth.goToLogin')}
          </Link>
        </div>
      </div>
    </div>
  );
};