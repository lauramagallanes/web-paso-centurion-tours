import React from 'react';
import { useNavigate } from 'react-router-dom';

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
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
    }}>
      <div style={{
        background: '#1e293b',
        borderRadius: '16px',
        padding: '2rem',
        maxWidth: '420px',
        width: '90%',
        textAlign: 'center',
        color: '#e2e8f0',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="#f59e0b">
            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
          </svg>
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem', color: '#f8fafc' }}>
          Inicia sesión para reservar
        </h2>
        <p style={{ fontSize: '0.95rem', color: '#94a3b8', marginBottom: '1.5rem', lineHeight: 1.5 }}>
          Para realizar una reserva necesitas tener una cuenta. Inicia sesión o crea una cuenta nueva.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            onClick={handleLogin}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#6d7e27',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Iniciar sesión
          </button>
          <button
            onClick={handleSignup}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: '1px solid #475569',
              backgroundColor: 'transparent',
              color: '#e2e8f0',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Crear cuenta
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem',
              background: 'none',
              border: 'none',
              color: '#64748b',
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginRequiredModal;
