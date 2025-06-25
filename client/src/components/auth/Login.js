import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldStates, setFieldStates] = useState({
    email: 'idle', // idle, valid, invalid
    password: 'idle'
  });
  const { login } = useAuth();
  const navigate = useNavigate();

  // Real-time validation
  useEffect(() => {
    validateField('email', formData.email);
  }, [formData.email]);

  useEffect(() => {
    validateField('password', formData.password);
  }, [formData.password]);

  const validateField = (fieldName, value) => {
    let isValid = true;
    let errorMessage = '';

    switch (fieldName) {
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
      const result = await login(formData);
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
    setFormData({
      email: 'demo@test.com',
      password: '123456'
    });
    setErrors({});
    setFieldStates({
      email: 'valid',
      password: 'valid'
    });
  };

  const getFieldIcon = (fieldName) => {
    const state = fieldStates[fieldName];
    if (state === 'valid') {
      return <CheckCircle size={20} className="field-icon valid" />;
    }
    return null;
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Welcome Back</h1>
          <p>Sign in to continue chatting</p>
        </div>

        {errors.general && (
          <div className="error-alert">
            <AlertCircle size={16} />
            <span>{errors.general}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
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
                placeholder="Enter your password"
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
            {errors.password && <div className="error-message">{errors.password}</div>}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || Object.values(fieldStates).some(state => state === 'invalid')}
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">Sign up here</Link>
          </p>
        </div>

        {/* Demo credentials */}
        <div className="demo-credentials">
          <h4>Demo Credentials (for testing):</h4>
          <div className="demo-info">
            <p><strong>Email:</strong> demo@test.com</p>
            <p><strong>Password:</strong> 123456</p>
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

export default Login; 