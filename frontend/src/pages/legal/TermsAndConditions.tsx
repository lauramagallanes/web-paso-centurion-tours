import React from 'react';
import { Link } from 'react-router-dom';
import LegalDocumentLayout from './LegalDocumentLayout';
import { routes } from '../../utils/routes';

const CONTACT_EMAIL = 'info@pasocenturion.com.uy';

const TermsAndConditions: React.FC = () => (
  <LegalDocumentLayout title="Términos y condiciones">
    <p>
      Los presentes términos regulan el acceso y uso del sitio web de MAGALLANES CAMEJO LAURA (nombre de fantasía Tinambú — Paso
      Centurión Tours) y los servicios de información y reserva que se ofrecen a través del mismo. Al navegar o contratar, aceptas
      estos términos en la versión publicada en el sitio. Si no estás de acuerdo, te pedimos que no utilices el sitio.
    </p>

    <h2>1. Identificación</h2>
    <p>
      Titular del sitio: MAGALLANES CAMEJO LAURA, que opera comercialmente como Tinambú — Paso Centurión Tours. Domicilio: Paso
      Centurión, Cerro Largo, Uruguay. Contacto: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>, teléfono +598 98 394
      653.
    </p>

    <h2>2. Objeto del sitio</h2>
    <p>
      El sitio tiene fines informativos y permite iniciar reservas de alojamiento y actividades (senderismo, observación de aves,
      etc.). La disponibilidad final, precios y condiciones particulares de cada servicio pueden confirmarse al cerrar la reserva
      o por comunicación directa con nosotros.
    </p>

    <h2>3. Registro y cuenta</h2>
    <p>
      Algunas funciones pueden requerir crear una cuenta o iniciar sesión. Eres responsable de la veracidad de los datos
      proporcionados y de la custodia de tus credenciales. Debes notificarnos de inmediato cualquier uso no autorizado de tu
      cuenta.
    </p>

    <h2>4. Reservas y contratación</h2>
    <p>
      Las reservas realizadas a través del sitio constituyen una propuesta de contratación. La confirmación puede estar sujeta a
      verificación de disponibilidad y al pago correspondiente (total o seña, según las opciones indicadas en el proceso de
      checkout). Los datos de la reserva (fechas, servicios, importes) formarán parte del acuerdo entre las partes una vez
      confirmados.
    </p>

    <h2>5. Horarios de ingreso y salida (check-in / check-out)</h2>
    <p>
      Cuando reserves alojamiento, los horarios de ingreso y salida podrán informarse durante el proceso de reserva o en la
      confirmación correspondiente. Es tu responsabilidad revisarlos y respetarlos salvo acuerdo distinto por escrito con nosotros.
    </p>

    <h2>6. Pagos</h2>
    <p>
      Los pagos en línea se procesan a través de Getnet u otro proveedor indicado en el momento del pago. El tratamiento de datos
      de tarjeta u otros medios de pago corresponde a dicho proveedor conforme a sus propias políticas de seguridad y privacidad.
      Nosotros no almacenamos el número completo de tu tarjeta en nuestros sistemas.
    </p>

    <h2>7. Precios e impuestos</h2>
    <p>
      Los precios mostrados se expresan en la moneda indicada en el sitio (por ejemplo pesos uruguayos), salvo que se indique lo
      contrario. Cargos fiscales o tasas locales aplicables se informarán cuando corresponda antes de confirmar el pago.
    </p>

    <h2>8. Cancelaciones y modificaciones</h2>
    <p>
      Las políticas de cancelación, cambio de fecha y no presentación (no-show) pueden variar según el tipo de servicio y la
      temporada. Las condiciones aplicables a tu reserva serán las comunicadas en la confirmación o en las condiciones particulares
      del producto. Si no hubiera texto específico, se aplicará lo pactado por correo o WhatsApp con el titular del servicio.
    </p>

    <h2>9. Actividades en entorno natural y riesgos</h2>
    <p>
      Las actividades ofrecidas se desarrollan en entornos naturales y rurales, por lo que pueden implicar riesgos inherentes
      propios de actividades al aire libre, condiciones climáticas variables, presencia de fauna, terrenos irregulares y
      limitaciones de conectividad o acceso. El visitante se compromete a seguir las indicaciones brindadas por los responsables o
      guías durante la actividad.
    </p>

    <h2>10. Aptitud física y salud</h2>
    <p>
      Es responsabilidad del visitante informar previamente cualquier condición médica, limitación física o situación relevante
      que pueda afectar su participación segura en las actividades.
    </p>

    <h2>11. Suspensión o reprogramación</h2>
    <p>
      Podremos suspender o reprogramar actividades por razones de seguridad, condiciones climáticas, estado de caminos, crecidas u
      otras circunstancias que puedan afectar adecuadamente la prestación del servicio. En esos casos actuaremos de buena fe
      procurando alternativas razonables y te informaremos por los medios de contacto disponibles.
    </p>

    <h2>12. Obligaciones del usuario</h2>
    <p>Te comprometes a:</p>
    <ul>
      <li>Utilizar el sitio de forma lícita y respetuosa.</li>
      <li>No intentar vulnerar la seguridad del sitio ni interferir con su funcionamiento.</li>
      <li>No utilizar robots o scraping masivo sin autorización previa por escrito.</li>
      <li>No cargar contenidos ilegales, difamatorios o que vulneren derechos de terceros.</li>
    </ul>

    <h2>13. Propiedad intelectual</h2>
    <p>
      Los textos, imágenes, logotipos, diseño y demás contenidos del sitio están protegidos por derechos de autor y otras normas.
      No se concede licencia para reproducirlos con fines comerciales sin autorización expresa.
    </p>

    <h2>14. Enlaces a terceros</h2>
    <p>
      El sitio puede incluir enlaces a plataformas de reserva externas (por ejemplo Booking.com, Airbnb, TripAdvisor) o redes
      sociales. No somos responsables del contenido ni de las prácticas de privacidad de esos sitios.
    </p>

    <h2>15. Limitación de responsabilidad</h2>
    <p>
      Ponemos esfuerzo razonable para mantener la información del sitio actualizada, pero pueden existir errores u omisiones. Las
      condiciones meteorológicas, cierres de senderos u otros eventos ajenos a nuestro control pueden afectar las actividades; en
      esos casos actuaremos de buena fe procurando alternativas razonables, sin perjuicio de los derechos que pudieran corresponder
      conforme a la normativa aplicable.
    </p>

    <h2>16. Ley aplicable y jurisdicción</h2>
    <p>
      Estos términos se interpretan según las leyes de la República Oriental del Uruguay. Para cualquier controversia, las partes
      se someten a los tribunales de Cerro Largo, sin perjuicio de normas imperativas que favorezcan al consumidor cuando resulten
      aplicables.
    </p>

    <h2>17. Privacidad y cookies</h2>
    <p>
      El tratamiento de datos personales se rige por nuestra <Link to={routes.privacy}>Política de privacidad</Link>. El uso de
      cookies se describe en la <Link to={routes.cookies}>Política de cookies</Link>.
    </p>

    <h2>18. Modificaciones</h2>
    <p>
      Podemos modificar estos términos publicando la nueva versión en el sitio con actualización de la fecha indicada al inicio.
      Para reservas ya confirmadas prevalecerán las condiciones aceptadas en el momento de la contratación, salvo que la ley exija
      aplicar cambios beneficiosos para el usuario.
    </p>
  </LegalDocumentLayout>
);

export default TermsAndConditions;
