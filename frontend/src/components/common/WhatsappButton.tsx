import React from 'react';

const WhatsAppButton: React.FC = () => {
  const phoneNumber = '59898394653';
  const message = 'Hola, me gustaría más información sobre Paso Centurión';
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-floating-btn"
      aria-label="Contactar por WhatsApp"
    >
      <img
        src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
        alt=""
        aria-hidden="true"
      />
    </a>
  );
};

export default WhatsAppButton;
