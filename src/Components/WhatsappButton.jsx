

const WhatsAppButton = () => {
  const phoneNumber = "59898394653"; 
  const message = "Hola, me gustaría más información sobre Paso Centurión"; 
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
         <button
        style={{
            position: "fixed",  
            bottom: "20px", 
            right: "20px", 
            backgroundColor: "#25D366",
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            border: "none",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            cursor: "pointer",
            boxShadow: "0 4px 6px rgba(0,0,0,0.2)",
            zIndex: "1000", 
          }}
      >
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
          alt="WhatsApp"
          style={{ width: "35px", height: "35px" }}
        />
      </button>
    </a>
  );
};

export default WhatsAppButton;