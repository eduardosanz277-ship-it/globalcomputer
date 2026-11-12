import type { Metadata } from "next";
import Link from "next/link";
import { LocalizedText } from "@/components/i18n/LocalizedText";
import { LocalizedContent } from "@/components/i18n/LocalizedContent";

export const metadata: Metadata = {
  title: "Términos y condiciones | Global Computers USA",
  description:
    "Conoce los términos que regulan el uso del sitio y el programa de mensajes de texto de Global Computers USA.",
};

function ContactInfo({ lang }: { lang: "es" | "en" }) {
  return (
    <address className="not-italic space-y-1">
      <p className="font-medium">GLOBAL COMPUTERS USA CORP</p>
      <p>
        {lang === "es" ? "Sitio web" : "Website"}:{" "}
        <a
          href="https://www.globalcomputersusa.com/"
          className="underline underline-offset-4 hover:text-foreground transition-colors"
        >
          www.globalcomputersusa.com
        </a>
      </p>
      <p>
        {lang === "es" ? "Correo electrónico" : "Email"}:{" "}
        <a
          href="mailto:globalcomputerusasales@gmail.com"
          className="underline underline-offset-4 hover:text-foreground transition-colors"
        >
          globalcomputerusasales@gmail.com
        </a>
      </p>
      <p>
        {lang === "es" ? "Teléfono" : "Phone"}:{" "}
        <a
          href="tel:+17863951076"
          className="underline underline-offset-4 hover:text-foreground transition-colors"
        >
          +1 (786) 395-1076
        </a>
      </p>
    </address>
  );
}

export default function TerminosPage() {
  return (
    <main className="min-h-[60vh] bg-gradient-to-b from-muted/30 via-background to-background">
      {/* Header */}
      <div className="border-b border-border/60 bg-card/40">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            <LocalizedText
              es="Términos y condiciones"
              en="Terms and Conditions"
            />
          </h1>
          <p className="text-sm text-foreground/50 mt-2">
            <LocalizedText
              es="Última actualización: 11 de noviembre de 2026"
              en="Last updated: November 11, 2026"
            />
          </p>
          <p className="mt-4 text-base text-foreground/70 max-w-2xl">
            <LocalizedText
              es="Estos términos regulan el uso del sitio www.globalcomputersusa.com y del programa de mensajes de texto de GLOBAL COMPUTERS USA CORP."
              en="These terms govern the use of www.globalcomputersusa.com and the GLOBAL COMPUTERS USA CORP text message program."
            />
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="space-y-10 [&_section]:scroll-mt-20">

          {/* 1. Información y servicios */}
          <section id="section-1">
            <h2 className="text-xl font-semibold text-foreground mb-3">
              1.{" "}
              <LocalizedText
                es="Información y servicios"
                en="Information and services"
              />
            </h2>
            <div className="text-foreground/75 space-y-3 leading-relaxed">
              <LocalizedContent
                es={
                  <p>
                    GLOBAL Computers USA ofrece productos y servicios
                    relacionados con cámaras de seguridad, alarmas, redes,
                    sistemas de control de acceso, audio y soluciones IT. La
                    información del sitio es de carácter general. La
                    disponibilidad, compatibilidad, alcance, precio y plazo de
                    cada proyecto se confirmarán mediante la cotización o el
                    acuerdo correspondiente.
                  </p>
                }
                en={
                  <p>
                    GLOBAL Computers USA offers products and services related
                    to security cameras, alarms, networks, access control
                    systems, audio, and IT solutions. Site information is
                    general in nature. Availability, compatibility, scope,
                    price, and timeline for each project will be confirmed
                    through the corresponding quote or agreement.
                  </p>
                }
              />
            </div>
          </section>

          {/* 2. Solicitudes y cotizaciones */}
          <section id="section-2">
            <h2 className="text-xl font-semibold text-foreground mb-3">
              2.{" "}
              <LocalizedText
                es="Solicitudes y cotizaciones"
                en="Requests and quotes"
              />
            </h2>
            <div className="text-foreground/75 space-y-3 leading-relaxed">
              <LocalizedContent
                es={
                  <>
                    <p>
                      Enviar un formulario o solicitar información no confirma
                      una contratación ni una cita. Las cotizaciones pueden
                      requerir información adicional o una evaluación del
                      lugar.
                    </p>
                    <p className="mt-3">
                      El alcance de los trabajos, equipos, pagos, garantías y
                      demás condiciones se establecerá en la propuesta o
                      acuerdo aceptado por el cliente. Cualquier modificación
                      del alcance deberá confirmarse entre las partes. Las
                      condiciones específicas de una compra o servicio se
                      comunicarán antes de su aceptación.
                    </p>
                  </>
                }
                en={
                  <>
                    <p>
                      Submitting a form or requesting information does not
                      confirm a service engagement or appointment. Quotes may
                      require additional information or a site evaluation.
                    </p>
                    <p className="mt-3">
                      The scope of work, equipment, payments, warranties, and
                      other conditions will be established in the proposal or
                      agreement accepted by the client. Any scope modifications
                      must be confirmed between the parties. Specific conditions
                      of a purchase or service will be communicated before
                      acceptance.
                    </p>
                  </>
                }
              />
            </div>
          </section>

          {/* 3. Uso del sitio */}
          <section id="section-3">
            <h2 className="text-xl font-semibold text-foreground mb-3">
              3.{" "}
              <LocalizedText es="Uso del sitio" en="Use of the site" />
            </h2>
            <div className="text-foreground/75 space-y-3 leading-relaxed">
              <LocalizedContent
                es={
                  <p>
                    Debes proporcionar información de contacto correcta y
                    utilizar el sitio de manera lícita. No está permitido
                    enviar contenido fraudulento, intentar acceder sin
                    autorización a nuestros sistemas o interferir con el
                    funcionamiento del sitio.
                  </p>
                }
                en={
                  <p>
                    You must provide accurate contact information and use the
                    site lawfully. It is not permitted to submit fraudulent
                    content, attempt unauthorized access to our systems, or
                    interfere with the site's operation.
                  </p>
                }
              />
            </div>
          </section>

          {/* 4. Programa de SMS */}
          <section id="section-4">
            <h2 className="text-xl font-semibold text-foreground mb-3">
              4.{" "}
              <LocalizedText
                es="Programa de SMS de atención al cliente"
                en="Customer service SMS program"
              />
            </h2>
            <div className="text-foreground/75 space-y-3 leading-relaxed">
              <LocalizedContent
                es={
                  <>
                    <p>
                      <strong>Nombre del programa:</strong> GLOBAL COMPUTERS
                      USA CORP — Atención al cliente por SMS.
                    </p>
                    <p className="mt-3">
                      Las personas que autoricen expresamente este canal podrán
                      recibir mensajes para:
                    </p>
                    <ul className="list-disc pl-6 space-y-1 mt-2">
                      <li>
                        Responder consultas sobre nuestros productos y
                        servicios.
                      </li>
                      <li>Dar seguimiento a cotizaciones solicitadas.</li>
                      <li>Confirmar, recordar o modificar citas.</li>
                      <li>Coordinar visitas e instalaciones.</li>
                      <li>Atender solicitudes de soporte.</li>
                    </ul>
                    <p className="mt-3">
                      Este programa no incluye ofertas, descuentos ni campañas
                      promocionales.
                    </p>

                    <h3 className="text-base font-semibold text-foreground mt-5 mb-2">
                      Consentimiento
                    </h3>
                    <p>
                      La inscripción requiere una acción afirmativa de
                      autorización, como seleccionar una casilla de
                      consentimiento que no esté marcada previamente. Aceptar
                      SMS es opcional y no constituye una condición de compra
                      o contratación. Puedes enviar una consulta sin aceptar
                      mensajes de texto. Aceptar estos términos o proporcionar
                      un número de teléfono no sustituye el consentimiento
                      específico para SMS.
                    </p>

                    <h3 className="text-base font-semibold text-foreground mt-5 mb-2">
                      Frecuencia y cargos
                    </h3>
                    <p>
                      La frecuencia de mensajes varía según tus solicitudes y
                      los servicios coordinados. Pueden enviarse varios
                      mensajes durante la atención de una misma solicitud.
                      GLOBAL Computers USA no cobra una tarifa adicional por la
                      suscripción al programa. Tu operador puede aplicar cargos
                      por mensajes y datos. Consulta tu plan telefónico para
                      conocer esos cargos.
                    </p>

                    <h3 className="text-base font-semibold text-foreground mt-5 mb-2">
                      Cómo cancelar
                    </h3>
                    <p>
                      Puedes cancelar tu suscripción respondiendo{" "}
                      <strong>STOP</strong> a cualquiera de nuestros SMS.
                      Podrás recibir un mensaje final confirmando la
                      cancelación. Después no recibirás más mensajes del
                      programa, salvo que vuelvas a autorizar expresamente tu
                      inscripción. Cancelar SMS no cancela automáticamente una
                      cita, un pedido o un servicio contratado. Para modificar
                      esos servicios, comunícate con nuestro equipo.
                    </p>

                    <h3 className="text-base font-semibold text-foreground mt-5 mb-2">
                      Ayuda
                    </h3>
                    <p>
                      Responde <strong>HELP</strong> para solicitar ayuda o
                      contáctanos en:<br />
                      Correo:{" "}
                      <a
                        href="mailto:globalcomputerusasales@gmail.com"
                        className="underline underline-offset-4 hover:text-foreground transition-colors"
                      >
                        globalcomputerusasales@gmail.com
                      </a><br />
                      Teléfono:{" "}
                      <a
                        href="tel:+17863951076"
                        className="underline underline-offset-4 hover:text-foreground transition-colors"
                      >
                        +1 (786) 395-1076
                      </a>
                    </p>

                    <h3 className="text-base font-semibold text-foreground mt-5 mb-2">
                      Entrega de mensajes
                    </h3>
                    <p>
                      La entrega depende de la disponibilidad de las redes y de
                      tu operador. Los operadores no son responsables de
                      mensajes retrasados o no entregados. Los SMS no deben
                      utilizarse como canal para emergencias ni como sustituto
                      de un servicio de monitoreo contratado.
                    </p>

                    <h3 className="text-base font-semibold text-foreground mt-5 mb-2">
                      Número de teléfono
                    </h3>
                    <p>
                      Debes proporcionar un número que controles y para el que
                      puedas autorizar comunicaciones. Avísanos si cambias de
                      número o dejas de utilizarlo para que podamos actualizar
                      nuestros registros.
                    </p>
                  </>
                }
                en={
                  <>
                    <p>
                      <strong>Program name:</strong> GLOBAL COMPUTERS USA CORP
                      — Customer Service by SMS.
                    </p>
                    <p className="mt-3">
                      Those who expressly authorize this channel may receive
                      messages to:
                    </p>
                    <ul className="list-disc pl-6 space-y-1 mt-2">
                      <li>
                        Answer inquiries about our products and services.
                      </li>
                      <li>Follow up on requested quotes.</li>
                      <li>Confirm, remind, or modify appointments.</li>
                      <li>Coordinate visits and installations.</li>
                      <li>Handle support requests.</li>
                    </ul>
                    <p className="mt-3">
                      This program does not include offers, discounts, or
                      promotional campaigns.
                    </p>

                    <h3 className="text-base font-semibold text-foreground mt-5 mb-2">
                      Consent
                    </h3>
                    <p>
                      Enrollment requires an affirmative authorization action,
                      such as selecting an unchecked consent checkbox. Accepting
                      SMS is optional and does not constitute a condition of
                      purchase or service engagement. You may submit an inquiry
                      without accepting text messages. Accepting these terms or
                      providing a phone number does not replace specific SMS
                      consent.
                    </p>

                    <h3 className="text-base font-semibold text-foreground mt-5 mb-2">
                      Frequency and charges
                    </h3>
                    <p>
                      Message frequency varies according to your requests and
                      coordinated services. Multiple messages may be sent during
                      the handling of a single request. GLOBAL Computers USA
                      does not charge an additional fee for program enrollment.
                      Your carrier may apply message and data rates. Check your
                      phone plan for those charges.
                    </p>

                    <h3 className="text-base font-semibold text-foreground mt-5 mb-2">
                      How to cancel
                    </h3>
                    <p>
                      You may cancel your subscription by replying{" "}
                      <strong>STOP</strong> to any of our SMS messages. You may
                      receive a final message confirming the cancellation. After
                      that you will not receive further messages from the
                      program unless you again expressly authorize enrollment.
                      Canceling SMS does not automatically cancel an
                      appointment, order, or contracted service. To modify those
                      services, please contact our team.
                    </p>

                    <h3 className="text-base font-semibold text-foreground mt-5 mb-2">
                      Help
                    </h3>
                    <p>
                      Reply <strong>HELP</strong> for assistance or contact
                      us at:<br />
                      Email:{" "}
                      <a
                        href="mailto:globalcomputerusasales@gmail.com"
                        className="underline underline-offset-4 hover:text-foreground transition-colors"
                      >
                        globalcomputerusasales@gmail.com
                      </a><br />
                      Phone:{" "}
                      <a
                        href="tel:+17863951076"
                        className="underline underline-offset-4 hover:text-foreground transition-colors"
                      >
                        +1 (786) 395-1076
                      </a>
                    </p>

                    <h3 className="text-base font-semibold text-foreground mt-5 mb-2">
                      Message delivery
                    </h3>
                    <p>
                      Delivery depends on network availability and your carrier.
                      Carriers are not responsible for delayed or undelivered
                      messages. SMS should not be used as an emergency channel
                      or as a substitute for a contracted monitoring service.
                    </p>

                    <h3 className="text-base font-semibold text-foreground mt-5 mb-2">
                      Phone number
                    </h3>
                    <p>
                      You must provide a number you control and for which you
                      can authorize communications. Notify us if you change your
                      number or stop using it so we can update our records.
                    </p>
                  </>
                }
              />
            </div>
          </section>

          {/* 5. Privacidad */}
          <section id="section-5">
            <h2 className="text-xl font-semibold text-foreground mb-3">
              5.{" "}
              <LocalizedText es="Privacidad" en="Privacy" />
            </h2>
            <div className="text-foreground/75 space-y-3 leading-relaxed">
              <LocalizedContent
                es={
                  <p>
                    El tratamiento de la información personal y del
                    consentimiento de SMS se describe en nuestra{" "}
                    <Link
                      href="/privacy"
                      className="underline underline-offset-4 hover:text-foreground transition-colors"
                    >
                      Política de privacidad
                    </Link>
                    .
                  </p>
                }
                en={
                  <p>
                    The handling of personal information and SMS consent is
                    described in our{" "}
                    <Link
                      href="/privacy"
                      className="underline underline-offset-4 hover:text-foreground transition-colors"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </p>
                }
              />
            </div>
          </section>

          {/* 6. Contenido y enlaces */}
          <section id="section-6">
            <h2 className="text-xl font-semibold text-foreground mb-3">
              6.{" "}
              <LocalizedText
                es="Contenido y enlaces externos"
                en="Content and external links"
              />
            </h2>
            <div className="text-foreground/75 space-y-3 leading-relaxed">
              <LocalizedContent
                es={
                  <p>
                    El contenido del sitio pertenece a GLOBAL Computers USA o
                    se utiliza con autorización. Su reproducción o uso
                    comercial requiere el permiso correspondiente. Los enlaces
                    a sitios de terceros se proporcionan como referencia. No
                    controlamos su contenido ni sus condiciones.
                  </p>
                }
                en={
                  <p>
                    Site content belongs to GLOBAL Computers USA or is used
                    with authorization. Its reproduction or commercial use
                    requires the corresponding permission. Links to third-party
                    sites are provided for reference. We do not control their
                    content or terms.
                  </p>
                }
              />
            </div>
          </section>

          {/* 7. Actualizaciones */}
          <section id="section-7">
            <h2 className="text-xl font-semibold text-foreground mb-3">
              7.{" "}
              <LocalizedText es="Actualizaciones" en="Updates" />
            </h2>
            <div className="text-foreground/75 space-y-3 leading-relaxed">
              <LocalizedContent
                es={
                  <p>
                    Podemos actualizar estos términos y publicar la versión
                    revisada en esta página. Los cambios no sustituyen el
                    consentimiento necesario para enviar SMS ni modifican
                    automáticamente los acuerdos de servicio ya aceptados.
                  </p>
                }
                en={
                  <p>
                    We may update these terms and publish the revised version
                    on this page. Changes do not replace the consent required
                    to send SMS or automatically modify previously accepted
                    service agreements.
                  </p>
                }
              />
            </div>
          </section>

          {/* 8. Contacto */}
          <section id="section-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">
              8.{" "}
              <LocalizedText es="Contacto" en="Contact" />
            </h2>
            <div className="text-foreground/75 space-y-3 leading-relaxed">
              <LocalizedContent
                es={<ContactInfo lang="es" />}
                en={<ContactInfo lang="en" />}
              />
            </div>
          </section>
        </div>

        {/* Footer nav */}
        <div className="mt-14 flex flex-wrap items-center gap-4 border-t border-border/60 pt-8">
          <Link
            href="/"
            className="text-sm text-foreground/60 hover:text-foreground transition-colors"
          >
            ←{" "}
            <LocalizedText es="Volver al inicio" en="Back to home" />
          </Link>
          <span className="text-border hidden sm:inline">|</span>
          <Link
            href="/privacy"
            className="text-sm text-foreground/60 hover:text-foreground transition-colors"
          >
            <LocalizedText
              es="← Ver Política de privacidad"
              en="← View Privacy Policy"
            />
          </Link>
        </div>
      </div>
    </main>
  );
}
