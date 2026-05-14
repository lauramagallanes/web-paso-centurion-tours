import React from 'react';
import { Link } from 'react-router-dom';
import LegalDocumentLayout from './LegalDocumentLayout';
import { routes } from '../../utils/routes';

const CONTACT_EMAIL = 'info@pasocenturion.com.uy';

const PrivacyPolicy: React.FC = () => (
  <LegalDocumentLayout title="Política de privacidad">
    <p>
      MAGALLANES CAMEJO LAURA, que opera bajo el nombre de fantasía Tinambú — Paso Centurión Tours (&quot;nosotros&quot;,
      &quot;el sitio&quot;), se compromete a proteger la privacidad de las personas que utilizan este sitio web y los servicios
      asociados. Esta política describe qué datos podemos tratar, con qué fines y qué derechos tienes conforme a la normativa
      aplicable en Uruguay, en particular la Ley N.º 18.331 y normas concordantes.
    </p>

    <h2>1. Responsable del tratamiento</h2>
    <p>
      Responsable: MAGALLANES CAMEJO LAURA, nombre de fantasía Tinambú — Paso Centurión Tours, con domicilio en Paso Centurión,
      Cerro Largo, Uruguay. Contacto para consultas de privacidad:{' '}
      <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
    </p>

    <h2>2. Datos que podemos recabar</h2>
    <p>Según cómo interactúas con el sitio, podemos tratar, entre otros:</p>
    <ul>
      <li>
        Datos identificativos y de contacto (nombre, correo electrónico, teléfono) cuando completas formularios o realizas una
        reserva.
      </li>
      <li>Datos de la reserva (fechas, servicios contratados, número de personas, observaciones).</li>
      <li>
        Datos de facturación y pago gestionados por el proveedor de pagos (por ejemplo Getnet), según lo que corresponda en cada
        operación.
      </li>
      <li>
        Datos técnicos generados automáticamente (dirección IP, tipo de navegador, páginas visitadas, marca temporal), cuando
        resulte necesario por seguridad o mejora del servicio.
      </li>
    </ul>

    <h2>3. Finalidades y bases</h2>
    <p>Tratamos los datos para:</p>
    <ul>
      <li>Gestionar consultas, reservas y prestación del servicio turístico y de alojamiento.</li>
      <li>Procesar pagos y cumplir obligaciones contables, fiscales y administrativas.</li>
      <li>Mantenerte informado sobre tu reserva y comunicaciones relacionadas con el contrato.</li>
      <li>Mejorar la seguridad del sitio y prevenir fraudes o usos indebidos.</li>
      <li>Cumplir obligaciones legales aplicables.</li>
    </ul>
    <p>
      Cuando el tratamiento se base en tu consentimiento (por ejemplo comunicaciones comerciales opcionales), podrás retirarlo en
      cualquier momento sin afectar la licitud del tratamiento previo.
    </p>

    <h2>4. Conservación</h2>
    <p>
      Conservamos los datos el tiempo necesario para cumplir las finalidades indicadas y las obligaciones legales (por ejemplo
      registros contables). Pasado ese plazo, los datos se suprimen o anonimizan cuando sea posible.
    </p>

    <h2>5. Cesiones y encargados</h2>
    <p>
      Podemos comunicar datos a proveedores que nos presten servicios estrictamente necesarios (alojamiento web, pasarela de pago,
      mensajería), con obligaciones de confidencialidad y seguridad. Algunos proveedores pueden estar ubicados fuera de Uruguay;
      en ese caso adoptamos las medidas previstas por la ley para garantizar un nivel adecuado de protección.
    </p>

    <h2>6. Tus derechos</h2>
    <p>
      Puedes solicitar acceso, rectificación, actualización, inclusión, supresión, limitación del tratamiento u oposición cuando
      corresponda, y presentar reclamos ante la autoridad de protección de datos. Para ejercer estos derechos, escríbenos a{' '}
      <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> indicando tu solicitud de forma clara.
    </p>

    <h2>7. Seguridad</h2>
    <p>
      Aplicamos medidas técnicas y organizativas razonables para proteger los datos frente a accesos no autorizados, pérdida o
      alteración. Ningún sistema es infalible; si detectas un problema, comunícalo de inmediato.
    </p>

    <h2>8. Menores</h2>
    <p>
      Los servicios no están dirigidos a menores de edad sin el consentimiento o autorización de sus padres o tutores. Si crees
      que hemos recabado datos de un menor sin la debida autorización, contáctanos para subsanarlo.
    </p>

    <h2>9. Cookies y almacenamiento local</h2>
    <p>
      El uso de cookies y tecnologías similares en el navegador se describe en nuestra{' '}
      <Link to={routes.cookies}>Política de cookies</Link>. El tratamiento derivado de dichas tecnologías se relaciona con esta
      política cuando implique datos personales.
    </p>

    <h2>10. Cambios</h2>
    <p>
      Podemos actualizar esta política para reflejar cambios legales o del sitio. La fecha de última actualización figura al
      inicio del documento. El uso continuado del sitio tras cambios relevantes implica que tomaste conocimiento de la versión
      vigente, salvo que la ley exija otro procedimiento.
    </p>

    <p>
      Para las condiciones generales de uso y contratación, consulta los{' '}
      <Link to={routes.terms}>Términos y condiciones</Link>.
    </p>
  </LegalDocumentLayout>
);

export default PrivacyPolicy;
