import React, { useState } from 'react';
import { Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { routes } from '../../utils/routes';
import logoWhite from '../../assets/images/logo/logo_white.svg';
import logoBlack from '../../assets/images/logo/logo_black.svg';
import './LoginPage.css';

const LoginPage: React.FC = () => {
  const { state, login, signup, clearError } = useAuth();
  const { theme } = useTheme();
  const location = useLocation();
  const locationState = location.state as { tab?: string; returnTo?: string } | null;
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(
    locationState?.tab === 'signup' ? 'signup' : 'login'
  );

  // Form states
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({
    email: '', password: '', confirmPassword: '', nombreCompleto: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redirect if authenticated
  if (state.isAuthenticated) {
    if (state.user?.tipo === 'ADMIN') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to={locationState?.returnTo || '/'} replace />;
  }

  const switchTab = (tab: 'login' | 'signup') => {
    setActiveTab(tab);
    clearError();
    setErrors({});
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!loginData.email.trim()) newErrors.email = 'Email es obligatorio';
    else if (!/\S+@\S+\.\S+/.test(loginData.email)) newErrors.email = 'Email no valido';
    if (!loginData.password.trim()) newErrors.password = 'Contrasena es obligatoria';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    clearError();
    try {
      await login(loginData.email, loginData.password);
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!signupData.nombreCompleto.trim()) newErrors.nombreCompleto = 'Nombre es obligatorio';
    else if (signupData.nombreCompleto.trim().length < 2) newErrors.nombreCompleto = 'Minimo 2 caracteres';
    if (!signupData.email.trim()) newErrors.email = 'Email es obligatorio';
    else if (!/\S+@\S+\.\S+/.test(signupData.email)) newErrors.email = 'Email no valido';
    if (!signupData.password.trim()) newErrors.password = 'Contrasena es obligatoria';
    else if (signupData.password.length < 8) newErrors.password = 'Minimo 8 caracteres';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(signupData.password))
      newErrors.password = 'Debe incluir mayuscula, minuscula y numero';
    if (signupData.password !== signupData.confirmPassword)
      newErrors.confirmPassword = 'Las contrasenas no coinciden';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    clearError();
    try {
      await signup(signupData.email, signupData.password, signupData.nombreCompleto);
    } catch (err) {
      console.error('Signup error:', err);
    }
  };

  const getPasswordStrength = (pw: string) => {
    if (!pw) return null;
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[a-z]/.test(pw)) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/\d/.test(pw)) s++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pw)) s++;
    if (s < 2) return { pct: 25, color: '#ef4444', label: 'Debil' };
    if (s < 4) return { pct: 60, color: '#f59e0b', label: 'Media' };
    return { pct: 100, color: '#22c55e', label: 'Fuerte' };
  };

  const strength = getPasswordStrength(signupData.password);

  return (
    <div className="lp-page">
      <div className="lp-card">
        {/* Logo */}
        <Link to={routes.home} className="lp-logo">
          <img src={theme === 'dark' ? logoWhite : logoBlack} alt="Tinambu" className="lp-logo-img" />
        </Link>

        {/* Tabs */}
        <div className="lp-tabs">
          <button
            className={`lp-tab ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => switchTab('login')}
          >
            Iniciar sesion
          </button>
          <button
            className={`lp-tab ${activeTab === 'signup' ? 'active' : ''}`}
            onClick={() => switchTab('signup')}
          >
            Crear cuenta
          </button>
        </div>

        {/* Error */}
        {state.error && (
          <div className="lp-error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <span>{state.error}</span>
            <button className="lp-error-close" onClick={clearError}>&times;</button>
          </div>
        )}

        {/* Login Form */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="lp-form">
            <div className="lp-field">
              <label className="lp-label">Email</label>
              <input
                type="email"
                className={`lp-input ${errors.email ? 'error' : ''}`}
                placeholder="tu@email.com"
                value={loginData.email}
                onChange={e => { setLoginData(d => ({...d, email: e.target.value})); setErrors(er => ({...er, email: ''})); }}
                disabled={state.loading}
              />
              {errors.email && <span className="lp-field-error">{errors.email}</span>}
            </div>
            <div className="lp-field">
              <label className="lp-label">Contrasena</label>
              <input
                type="password"
                className={`lp-input ${errors.password ? 'error' : ''}`}
                placeholder="Tu contrasena"
                value={loginData.password}
                onChange={e => { setLoginData(d => ({...d, password: e.target.value})); setErrors(er => ({...er, password: ''})); }}
                disabled={state.loading}
              />
              {errors.password && <span className="lp-field-error">{errors.password}</span>}
            </div>
            <button type="submit" className="lp-submit" disabled={state.loading}>
              {state.loading ? 'Ingresando...' : 'Iniciar sesion'}
            </button>
          </form>
        )}

        {/* Signup Form */}
        {activeTab === 'signup' && (
          <form onSubmit={handleSignupSubmit} className="lp-form">
            <div className="lp-field">
              <label className="lp-label">Nombre completo</label>
              <input
                type="text"
                className={`lp-input ${errors.nombreCompleto ? 'error' : ''}`}
                placeholder="Tu nombre completo"
                value={signupData.nombreCompleto}
                onChange={e => { setSignupData(d => ({...d, nombreCompleto: e.target.value})); setErrors(er => ({...er, nombreCompleto: ''})); }}
                disabled={state.loading}
              />
              {errors.nombreCompleto && <span className="lp-field-error">{errors.nombreCompleto}</span>}
            </div>
            <div className="lp-field">
              <label className="lp-label">Email</label>
              <input
                type="email"
                className={`lp-input ${errors.email ? 'error' : ''}`}
                placeholder="tu@email.com"
                value={signupData.email}
                onChange={e => { setSignupData(d => ({...d, email: e.target.value})); setErrors(er => ({...er, email: ''})); }}
                disabled={state.loading}
              />
              {errors.email && <span className="lp-field-error">{errors.email}</span>}
            </div>
            <div className="lp-field">
              <label className="lp-label">Contrasena</label>
              <input
                type="password"
                className={`lp-input ${errors.password ? 'error' : ''}`}
                placeholder="Minimo 8 caracteres"
                value={signupData.password}
                onChange={e => { setSignupData(d => ({...d, password: e.target.value})); setErrors(er => ({...er, password: ''})); }}
                disabled={state.loading}
              />
              {errors.password && <span className="lp-field-error">{errors.password}</span>}
              {strength && (
                <div className="lp-strength">
                  <div className="lp-strength-bar">
                    <div className="lp-strength-fill" style={{ width: `${strength.pct}%`, background: strength.color }} />
                  </div>
                  <span className="lp-strength-label" style={{ color: strength.color }}>{strength.label}</span>
                </div>
              )}
            </div>
            <div className="lp-field">
              <label className="lp-label">Confirmar contrasena</label>
              <input
                type="password"
                className={`lp-input ${errors.confirmPassword ? 'error' : ''}`}
                placeholder="Repite tu contrasena"
                value={signupData.confirmPassword}
                onChange={e => { setSignupData(d => ({...d, confirmPassword: e.target.value})); setErrors(er => ({...er, confirmPassword: ''})); }}
                disabled={state.loading}
              />
              {errors.confirmPassword && <span className="lp-field-error">{errors.confirmPassword}</span>}
              {signupData.confirmPassword && signupData.password === signupData.confirmPassword && (
                <span className="lp-field-success">Las contrasenas coinciden</span>
              )}
            </div>
            <button type="submit" className="lp-submit" disabled={state.loading}>
              {state.loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>
        )}

        {/* Footer */}
        <div className="lp-footer">
          <Link to={routes.home} className="lp-back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
