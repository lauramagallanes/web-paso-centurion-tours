import React, { useState } from 'react';
import Button from './Button';
import './ContactModal.css';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ContactFormData {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  mensaje: string;
}

const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState<ContactFormData>({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    mensaje: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const response = await fetch('https://53dmek6dqk.execute-api.us-east-1.amazonaws.com/contacto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Error al enviar el mensaje');
      }

      setSubmitStatus('success');
      // Reset form
      setFormData({
        nombre: '',
        apellido: '',
        email: '',
        telefono: '',
        mensaje: ''
      });

      // Auto close after 2 seconds
      setTimeout(() => {
        onClose();
        setSubmitStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('Error sending contact form:', error);
      setSubmitStatus('error');
      setErrorMessage('Hubo un error al enviar tu mensaje. Por favor, intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="contact-modal-overlay" onClick={onClose}>
      <div className="contact-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="contact-modal-header">
          <h2 className="contact-modal-title">Contáctanos</h2>
          <button className="contact-modal-close" onClick={onClose} aria-label="Cerrar">
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="contact-modal-form">
          <div className="contact-form-row">
            <div className="contact-form-group">
              <label htmlFor="nombre" className="contact-form-label">
                Nombre <span className="required">*</span>
              </label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
                className="contact-form-input"
                placeholder="Tu nombre"
              />
            </div>

            <div className="contact-form-group">
              <label htmlFor="apellido" className="contact-form-label">
                Apellido <span className="required">*</span>
              </label>
              <input
                type="text"
                id="apellido"
                name="apellido"
                value={formData.apellido}
                onChange={handleChange}
                required
                className="contact-form-input"
                placeholder="Tu apellido"
              />
            </div>
          </div>

          <div className="contact-form-group">
            <label htmlFor="email" className="contact-form-label">
              Correo electrónico <span className="required">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="contact-form-input"
              placeholder="tu@email.com"
            />
          </div>

          <div className="contact-form-group">
            <label htmlFor="telefono" className="contact-form-label">
              Teléfono <span className="optional">(opcional)</span>
            </label>
            <input
              type="tel"
              id="telefono"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              className="contact-form-input"
              placeholder="+598 99 123 456"
            />
          </div>

          <div className="contact-form-group">
            <label htmlFor="mensaje" className="contact-form-label">
              Mensaje <span className="required">*</span>
            </label>
            <textarea
              id="mensaje"
              name="mensaje"
              value={formData.mensaje}
              onChange={handleChange}
              required
              rows={5}
              className="contact-form-textarea"
              placeholder="Escribe tu mensaje aquí..."
            />
          </div>

          {submitStatus === 'error' && (
            <div className="contact-form-error">
              <i className="bi bi-exclamation-circle"></i>
              {errorMessage}
            </div>
          )}

          {submitStatus === 'success' && (
            <div className="contact-form-success">
              <i className="bi bi-check-circle"></i>
              ¡Mensaje enviado exitosamente! Te responderemos pronto.
            </div>
          )}

          <div className="contact-form-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <i className="bi bi-hourglass-split"></i>
                  Enviando...
                </>
              ) : (
                <>
                  <i className="bi bi-send-fill"></i>
                  Enviar Mensaje
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactModal;





