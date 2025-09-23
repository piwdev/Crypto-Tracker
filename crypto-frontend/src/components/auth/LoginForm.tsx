import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { validation } from '../../utils/validation';
import ErrorMessage from '../common/ErrorMessage';
import LoadingSpinner from '../common/LoadingSpinner';
import './LoginForm.css';

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginFormErrors {
  email?: string;
  password?: string;
}

export const LoginForm: React.FC = () => {
  const { t } = useTranslation();
  const { login, loading, error, clearError } = useAuth();
  
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [serverErrors, setServerErrors] = useState<string>();
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

  // Clear auth error when component mounts or form data changes
  useEffect(() => {
    if (error) {
      setServerErrors(error);
      clearError();
    }
  }, []);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear field error when user starts typing
    if (errors[name as keyof LoginFormErrors]) {
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
    validateField(name, formData[name as keyof LoginFormData]);
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
    const newErrors: LoginFormErrors = {};
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
    });

    // Validate form
    if (!validateForm()) {
      return;
    }

    // Submit login request
    try {
      await login({
        email: formData.email,
        password: formData.password,
      });
      // Navigation will be handled by the auth context/routing
    } catch (error) {
      // Error is handled by the auth context
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="login-form-container">
      <div className="login-form-card">
        <h1 className="login-form-title">{t('auth.loginTitle')}</h1>
        
        {serverErrors && (
          <ErrorMessage 
            message={serverErrors} 
            onClose={clearError}
          />
        )}

        <form onSubmit={handleSubmit} className="login-form">
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
              autoComplete="current-password"
            />
            {touched.password && errors.password && (
              <span className="form-error">{errors.password}</span>
            )}
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? <LoadingSpinner size="small" /> : t('auth.loginButton')}
          </button>
        </form>

        <div className="login-form-footer">
          <Link to="/createaccount" className="create-account-link">
            {t('auth.goToRegister')}
          </Link>
        </div>
      </div>
    </div>
  );
};