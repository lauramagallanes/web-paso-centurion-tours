import React from 'react';
import { Link } from 'react-router-dom';
import LegalDocumentLayout from './LegalDocumentLayout';
import { routes } from '../../utils/routes';

const CONTACT_EMAIL = 'info@pasocenturion.com.uy';

const CookiePolicy: React.FC = () => (
  <LegalDocumentLayout title="Política de cookies">
    <p>
      Esta política explica cómo MAGALLANES CAMEJO LAURA (nombre de fantasía Tinambú — Paso Centurión Tours) utiliza cookies y
      tecnologías similares en el navegador cuando visitas nuestro sitio web. Para el tratamiento de datos personales en general,
      consulta nuestra <Link to={routes.privacy}>Política de privacidad</Link>.
    </p>

    <h2>1. ¿Qué son las cookies?</h2>
    <p>
      Las cookies son pequeños archivos que un sitio guarda en tu dispositivo para recordar información entre visitas o durante una
      misma sesión. Las &quot;tecnologías similares&quot; incluyen almacenamiento local del navegador (por ejemplo{' '}
      <code>localStorage</code>) cuando cumplen una función equivalente.
    </p>

    <h2>2. ¿Usamos cookies estrictamente necesarias?</h2>
    <p>
      El sitio puede utilizar cookies o mecanismos técnicos necesarios para su funcionamiento básico (por ejemplo mantener la
      sesión segura en el servidor cuando aplique, equilibrio de carga o preferencias esenciales). Estas cookies no requieren
      consentimiento previo según la práctica habitual para servicios solicitados expresamente por el usuario.
    </p>

    <h2>3. Almacenamiento local (localStorage)</h2>
    <p>La aplicación puede guardar datos en tu navegador para mejorar la experiencia, entre otros:</p>
    <ul>
      <li>
        <strong>Preferencia de tema</strong> (claro/oscuro), clave típica <code>tinambu-theme</code>.
      </li>
      <li>
        <strong>Sesión y cuenta</strong>: tokens de acceso y datos de usuario asociados al inicio de sesión cuando utilizas
        funciones que lo requieren.
      </li>
      <li>
        <strong>Carrito de reservas</strong> y datos relacionados con tu selección de servicios antes del pago.
      </li>
      <li>
        <strong>Favoritos</strong> u otras listas guardadas localmente para recordar tus elecciones en el dispositivo.
      </li>
    </ul>
    <p>
      Esta información permanece en tu equipo hasta que la borres desde la configuración del navegador o la aplicación limpie esos
      datos. No utilizamos estos mecanismos para perfilar publicitario en nuestro código propio.
    </p>

    <h2>4. Cookies de terceros y analítica</h2>
    <p>
      En la versión actual del sitio no incorporamos de forma habitual cookies de analítica publicitaria de terceros (por ejemplo
      remarketing). Si en el futuro se incorporaran servicios de medición de audiencia o mapas embebidos que depositen cookies de
      terceros, actualizaremos esta política y, cuando la ley lo exija, solicitaremos tu consentimiento mediante un banner o
      mecanismo equivalente.
    </p>

    <h2>5. Enlaces externos</h2>
    <p>
      Si abres enlaces a redes sociales o plataformas de reserva (Booking.com, Airbnb, TripAdvisor, WhatsApp, etc.), esos sitios
      pueden instalar sus propias cookies. Te recomendamos leer sus políticas de privacidad y cookies.
    </p>

    <h2>6. Cómo gestionar o eliminar cookies</h2>
    <p>
      Puedes bloquear o eliminar cookies y datos de sitios desde la configuración de tu navegador (Chrome, Firefox, Safari, Edge,
      etc.). Ten en cuenta que desactivar cookies técnicas o borrar el almacenamiento local puede impedir el inicio de sesión,
      vaciar el carrito o restablecer preferencias como el tema visual.
    </p>

    <h2>7. Contacto</h2>
    <p>
      Para consultas sobre esta política: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
    </p>

    <p>
      Condiciones generales del servicio: <Link to={routes.terms}>Términos y condiciones</Link>.
    </p>
  </LegalDocumentLayout>
);

export default CookiePolicy;
