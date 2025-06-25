import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { User, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldStates, setFieldStates] = useState({
    username: 'idle',
    email: 'idle',
    password: 'idle',
    confirmPassword: 'idle'
  });
  const { register } = useAuth();
  const navigate = useNavigate();

  // Real-time validation
  useEffect(() => {
    validateField('username', formData.username);
  }, [formData.username]);

  useEffect(() => {
    validateField('email', formData.email);
  }, [formData.email]);

  useEffect(() => {
    validateField('password', formData.password);
  }, [formData.password]);

  useEffect(() => {
    validateField('confirmPassword', formData.confirmPassword, formData.password);
  }, [formData.confirmPassword, formData.password]);

  const validateField = (fieldName, value, password = '') => {
    let isValid = true;
    let errorMessage = '';

    switch (fieldName) {
      case 'username':
        if (!value) {
          isValid = false;
          errorMessage = '';
        } else if (value.length < 3) {
          isValid = false;
          errorMessage = 'Username must be at least 3 characters';
        } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
          isValid = false;
          errorMessage = 'Username can only contain letters, numbers, and underscores';
        }
        break;
      case 'email':
        if (!value) {
          isValid = false;
          errorMessage = '';
        } else if (!/\S+@\S+\.\S+/.test(value)) {
          isValid = false;
          errorMessage = 'Please enter a valid email address';
        }
        break;
      case 'password':
        if (!value) {
          isValid = false;
          errorMessage = '';
        } else if (value.length < 6) {
          isValid = false;
          errorMessage = 'Password must be at least 6 characters';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          isValid = false;
          errorMessage = 'Password must contain uppercase, lowercase, and number';
        }
        break;
      case 'confirmPassword':
        if (!value) {
          isValid = false;
          errorMessage = '';
        } else if (value !== password) {
          isValid = false;
          errorMessage = 'Passwords do not match';
        }
        break;
      default:
        break;
    }

    setFieldStates(prev => ({
      ...prev,
      [fieldName]: value ? (isValid ? 'valid' : 'invalid') : 'idle'
    }));

    if (errorMessage) {
      setErrors(prev => ({ ...prev, [fieldName]: errorMessage }));
    } else {
      setErrors(prev => ({ ...prev, [fieldName]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Username validation
    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const result = await register(formData);
      if (result.success) {
        // Show success feedback before navigation
        setTimeout(() => {
          navigate('/chat');
        }, 500);
      } else {
        setErrors({ general: result.error });
      }
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDemoCredentials = () => {
    const demoData = {
      username: 'demo_user',
      email: 'demo@test.com',
      password: 'Demo123',
      confirmPassword: 'Demo123'
    };
    setFormData(demoData);
    setErrors({});
    setFieldStates({
      username: 'valid',
      email: 'valid',
      password: 'valid',
      confirmPassword: 'valid'
    });
  };

  const getFieldIcon = (fieldName) => {
    const state = fieldStates[fieldName];
    if (state === 'valid') {
      return <CheckCircle size={20} className="field-icon valid" />;
    }
    return null;
  };

  const getPasswordStrength = () => {
    if (!formData.password) return null;
    
    const hasLower = /[a-z]/.test(formData.password);
    const hasUpper = /[A-Z]/.test(formData.password);
    const hasNumber = /\d/.test(formData.password);
    const hasLength = formData.password.length >= 6;
    
    const strength = [hasLower, hasUpper, hasNumber, hasLength].filter(Boolean).length;
    
    if (strength <= 1) return { text: 'Weak', color: '#e53e3e' };
    if (strength <= 2) return { text: 'Fair', color: '#d69e2e' };
    if (strength <= 3) return { text: 'Good', color: '#38a169' };
    return { text: 'Strong', color: '#38a169' };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Create Account</h1>
          <p>Join us and start chatting</p>
        </div>

        {errors.general && (
          <div className="error-alert">
            <AlertCircle size={16} />
            <span>{errors.general}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username" className="form-label">Username</label>
            <div className="input-group">
              <User className="input-icon" size={20} />
              <input
                type="text"
                id="username"
                name="username"
                placeholder="Choose a username"
                value={formData.username}
                onChange={handleChange}
                className={`form-control ${fieldStates.username === 'invalid' ? 'error' : ''} ${fieldStates.username === 'valid' ? 'valid' : ''}`}
                required
              />
              {getFieldIcon('username')}
            </div>
            {errors.username && <div className="error-message">{errors.username}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">Email Address</label>
            <div className="input-group">
              <Mail className="input-icon" size={20} />
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                className={`form-control ${fieldStates.email === 'invalid' ? 'error' : ''} ${fieldStates.email === 'valid' ? 'valid' : ''}`}
                required
              />
              {getFieldIcon('email')}
            </div>
            {errors.email && <div className="error-message">{errors.email}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <div className="input-group">
              <Lock className="input-icon" size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                className={`form-control ${fieldStates.password === 'invalid' ? 'error' : ''} ${fieldStates.password === 'valid' ? 'valid' : ''}`}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
              {getFieldIcon('password')}
            </div>
            {formData.password && passwordStrength && (
              <div style={{ 
                fontSize: '12px', 
                marginTop: '4px', 
                color: passwordStrength.color,
                fontWeight: '500'
              }}>
                Password strength: {passwordStrength.text}
              </div>
            )}
            {errors.password && <div className="error-message">{errors.password}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
            <div className="input-group">
              <Lock className="input-icon" size={20} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`form-control ${fieldStates.confirmPassword === 'invalid' ? 'error' : ''} ${fieldStates.confirmPassword === 'valid' ? 'valid' : ''}`}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
              {getFieldIcon('confirmPassword')}
            </div>
            {errors.confirmPassword && <div className="error-message">{errors.confirmPassword}</div>}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || Object.values(fieldStates).some(state => state === 'invalid')}
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">Sign in here</Link>
          </p>
        </div>

        {/* Demo credentials */}
        <div className="demo-credentials">
          <h4>Demo Credentials (for testing):</h4>
          <div className="demo-info">
            <p><strong>Username:</strong> demo_user</p>
            <p><strong>Email:</strong> demo@test.com</p>
            <p><strong>Password:</strong> Demo123</p>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={handleDemoCredentials}
              type="button"
            >
              Fill Demo Credentials
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register; 