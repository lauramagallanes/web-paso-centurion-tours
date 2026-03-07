import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginRequiredModal.css';

interface LoginRequiredModalProps {
  show: boolean;
  onClose: () => void;
  returnPath?: string;
}

const LoginRequiredModal: React.FC<LoginRequiredModalProps> = ({ show, onClose, returnPath }) => {
  const navigate = useNavigate();

  if (!show) return null;

  const handleLogin = () => {
    onClose();
    navigate('/login', { state: { returnTo: returnPath || window.location.hash.replace('#', '') } });
  };

  const handleSignup = () => {
    onClose();
    navigate('/login', { state: { returnTo: returnPath || window.location.hash.replace('#', ''), tab: 'signup' } });
  };

  return (
    <div className="login-required-overlay">
      <div className="login-required-card">
        <div className="login-required-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
          </svg>
        </div>
        <h2 className="login-required-title">Inicia sesión para reservar</h2>
        <p className="login-required-body">
          Para realizar una reserva necesitas tener una cuenta. Inicia sesión o crea una cuenta nueva.
        </p>
        <div className="login-required-actions">
          <button className="btn-primary btn-full" onClick={handleLogin}>
            Iniciar sesión
          </button>
          <button className="btn-secondary btn-full" onClick={handleSignup}>
            Crear cuenta
          </button>
          <button className="login-required-cancel" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginRequiredModal;
