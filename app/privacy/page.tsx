import type { Metadata } from "next";
import Link from "next/link";
import { LocalizedText } from "@/components/i18n/LocalizedText";
import { LocalizedContent } from "@/components/i18n/LocalizedContent";
import { inter } from "@/lib/fonts/inter";

export const metadata: Metadata = {
  title: "Política de privacidad | Global Computers USA",
  description:
    "Conoce cómo Global Computers USA recopila, utiliza y protege tu información personal.",
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

export default function PrivacidadPage() {
  return (
    <main
      className={`${inter.className} min-h-[60vh] bg-gradient-to-b from-muted/30 via-background to-background`}
    >
      {/* Header */}
      <div className="border-b border-border/60 bg-card/40">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            <LocalizedText es="Política de privacidad" en="Privacy Policy" />
          </h1>
          <p className="text-sm text-foreground/50 mt-2">
            <LocalizedText
              es="Última actualización: 11 de noviembre de 2026"
              en="Last updated: November 11, 2026"
            />
          </p>
          <p className="mt-4 text-base text-foreground/70 max-w-2xl">
            <LocalizedText
              es="GLOBAL COMPUTERS USA CORP explica cómo recopila, utiliza y protege la información personal proporcionada a través de www.globalcomputersusa.com, sus formularios y sus canales de atención."
              en="GLOBAL COMPUTERS USA CORP explains how it collects, uses, and protects personal information provided through www.globalcomputersusa.com, its forms, and its service channels."
            />
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="space-y-10 [&_section]:scroll-mt-20">

          {/* 1. Información que recopilamos */}
          <section id="section-1">
            <h2 className="text-xl font-semibold text-foreground mb-3">
              1.{" "}
              <LocalizedText
                es="Información que recopilamos"
                en="Information we collect"
              />
            </h2>
            <div className="text-foreground/75 space-y-3 leading-relaxed">
              <LocalizedContent
                es={
                  <>
                    <p>
                      Podemos recopilar la información que nos proporcionas al
                      solicitar información, una cotización, una cita o
                      soporte, incluyendo:
                    </p>
                    <ul className="list-disc pl-6 space-y-1 mt-2">
                      <li>Nombre.</li>
                      <li>Correo electrónico.</li>
                      <li>Número de teléfono.</li>
                      <li>Dirección o ubicación del proyecto.</li>
                      <li>
                        Información sobre los productos o servicios que
                        necesitas.
                      </li>
                      <li>
                        Mensajes, solicitudes y comunicaciones con nuestro
                        equipo.
                      </li>
                      <li>
                        Tu elección de consentimiento para recibir SMS y el
                        registro de dicha autorización.
                      </li>
                    </ul>
                    <p className="mt-3">
                      El sitio también puede recopilar información técnica,
                      como dirección IP, navegador, dispositivo y registros de
                      acceso, mediante las herramientas utilizadas para su
                      funcionamiento y protección contra spam.
                    </p>
                  </>
                }
                en={
                  <>
                    <p>
                      We may collect information you provide when requesting
                      information, a quote, an appointment, or support,
                      including:
                    </p>
                    <ul className="list-disc pl-6 space-y-1 mt-2">
                      <li>Name.</li>
                      <li>Email address.</li>
                      <li>Phone number.</li>
                      <li>Address or project location.</li>
                      <li>
                        Information about the products or services you need.
                      </li>
                      <li>
                        Messages, requests, and communications with our team.
                      </li>
                      <li>
                        Your SMS consent choice and the record of that
                        authorization.
                      </li>
                    </ul>
                    <p className="mt-3">
                      The site may also collect technical information such as
                      IP address, browser, device, and access logs through
                      tools used for its operation and spam protection.
                    </p>
                  </>
                }
              />
            </div>
          </section>

          {/* 2. Cómo utilizamos tu información */}
          <section id="section-2">
            <h2 className="text-xl font-semibold text-foreground mb-3">
              2.{" "}
              <LocalizedText
                es="Cómo utilizamos tu información"
                en="How we use your information"
              />
            </h2>
            <div className="text-foreground/75 space-y-3 leading-relaxed">
              <LocalizedContent
                es={
                  <>
                    <p>Utilizamos la información para:</p>
                    <ul className="list-disc pl-6 space-y-1 mt-2">
                      <li>Responder consultas y solicitudes.</li>
                      <li>
                        Preparar y dar seguimiento a cotizaciones solicitadas.
                      </li>
                      <li>Coordinar citas, visitas e instalaciones.</li>
                      <li>
                        Brindar atención al cliente y soporte técnico.
                      </li>
                      <li>
                        Mantener registros de nuestras comunicaciones y
                        servicios.
                      </li>
                      <li>
                        Proteger el sitio, prevenir usos indebidos y cumplir
                        obligaciones legales.
                      </li>
                    </ul>
                  </>
                }
                en={
                  <>
                    <p>We use the information to:</p>
                    <ul className="list-disc pl-6 space-y-1 mt-2">
                      <li>Respond to inquiries and requests.</li>
                      <li>
                        Prepare and follow up on requested quotes.
                      </li>
                      <li>
                        Schedule appointments, visits, and installations.
                      </li>
                      <li>
                        Provide customer service and technical support.
                      </li>
                      <li>
                        Maintain records of our communications and services.
                      </li>
                      <li>
                        Protect the site, prevent misuse, and comply with
                        legal obligations.
                      </li>
                    </ul>
                  </>
                }
              />
            </div>
          </section>

          {/* 3. SMS */}
          <section id="section-3">
            <h2 className="text-xl font-semibold text-foreground mb-3">
              3.{" "}
              <LocalizedText
                es="Mensajes de texto SMS"
                en="SMS text messages"
              />
            </h2>
            <div className="text-foreground/75 space-y-3 leading-relaxed">
              <LocalizedContent
                es={
                  <>
                    <p>
                      Si autorizas expresamente recibir SMS de GLOBAL
                      COMPUTERS USA CORP, podremos enviarte mensajes
                      relacionados con tus consultas, cotizaciones solicitadas,
                      citas, instalaciones y solicitudes de soporte.
                    </p>
                    <ul className="list-disc pl-6 space-y-1 mt-2">
                      <li>
                        El consentimiento para recibir SMS es opcional y no es
                        una condición para comprar, contratar servicios o
                        enviar una consulta.
                      </li>
                      <li>
                        Proporcionar tu teléfono, por sí solo, no constituye
                        autorización para recibir SMS.
                      </li>
                      <li>
                        La frecuencia de mensajes puede variar según tu
                        solicitud.
                      </li>
                      <li>
                        Pueden aplicarse cargos por mensajes y datos conforme a
                        tu plan telefónico.
                      </li>
                      <li>
                        Puedes responder <strong>STOP</strong> para cancelar
                        los mensajes o <strong>HELP</strong> para obtener
                        ayuda.
                      </li>
                    </ul>
                    <p className="mt-3">
                      Esta autorización no incluye mensajes promocionales. Si
                      en el futuro ofrecemos promociones por SMS, solicitaremos
                      el consentimiento correspondiente por separado.
                    </p>
                  </>
                }
                en={
                  <>
                    <p>
                      If you expressly authorize receiving SMS from GLOBAL
                      COMPUTERS USA CORP, we may send you messages related to
                      your inquiries, requested quotes, appointments,
                      installations, and support requests.
                    </p>
                    <ul className="list-disc pl-6 space-y-1 mt-2">
                      <li>
                        SMS consent is optional and is not a condition for
                        purchasing, contracting services, or submitting an
                        inquiry.
                      </li>
                      <li>
                        Providing your phone number alone does not constitute
                        authorization to receive SMS.
                      </li>
                      <li>
                        Message frequency may vary depending on your request.
                      </li>
                      <li>
                        Message and data rates may apply according to your
                        phone plan.
                      </li>
                      <li>
                        You may reply <strong>STOP</strong> to cancel messages
                        or <strong>HELP</strong> for assistance.
                      </li>
                    </ul>
                    <p className="mt-3">
                      This authorization does not include promotional messages.
                      If we offer SMS promotions in the future, we will request
                      the corresponding consent separately.
                    </p>
                  </>
                }
              />
            </div>
          </section>

          {/* 4. Cómo compartimos */}
          <section id="section-4">
            <h2 className="text-xl font-semibold text-foreground mb-3">
              4.{" "}
              <LocalizedText
                es="Cómo compartimos la información"
                en="How we share information"
              />
            </h2>
            <div className="text-foreground/75 space-y-3 leading-relaxed">
              <LocalizedContent
                es={
                  <>
                    <p>
                      Podemos proporcionar la información necesaria a
                      proveedores que nos ayudan con el alojamiento del sitio,
                      la gestión de consultas, las comunicaciones, la
                      programación de citas y la atención al cliente. Su
                      acceso debe limitarse a la prestación de esos servicios.
                    </p>
                    <p className="mt-3">
                      No compartimos información móvil con terceros ni
                      afiliados para fines publicitarios o promocionales. Los
                      datos de inscripción y el consentimiento de SMS quedan
                      excluidos de cualquier intercambio para otros fines y no
                      se proporcionan a terceros para sus propias campañas o
                      usos independientes.
                    </p>
                    <p className="mt-3">
                      También podemos divulgar información cuando sea necesario
                      para cumplir una obligación legal, responder a una
                      solicitud válida de una autoridad o proteger nuestros
                      derechos y la seguridad de las personas.
                    </p>
                  </>
                }
                en={
                  <>
                    <p>
                      We may provide necessary information to vendors who
                      assist us with site hosting, inquiry management,
                      communications, appointment scheduling, and customer
                      service. Their access must be limited to providing those
                      services.
                    </p>
                    <p className="mt-3">
                      We do not share mobile information with third parties or
                      affiliates for advertising or promotional purposes.
                      Registration data and SMS consent are excluded from any
                      sharing for other purposes and are not provided to third
                      parties for their own campaigns or independent uses.
                    </p>
                    <p className="mt-3">
                      We may also disclose information when necessary to comply
                      with a legal obligation, respond to a valid authority
                      request, or protect our rights and the safety of
                      individuals.
                    </p>
                  </>
                }
              />
            </div>
          </section>

          {/* 5. Cookies */}
          <section id="section-5">
            <h2 className="text-xl font-semibold text-foreground mb-3">
              5.{" "}
              <LocalizedText
                es="Cookies y tecnologías similares"
                en="Cookies and similar technologies"
              />
            </h2>
            <div className="text-foreground/75 space-y-3 leading-relaxed">
              <LocalizedContent
                es={
                  <p>
                    El sitio y sus proveedores pueden utilizar cookies o
                    tecnologías similares para permitir su funcionamiento,
                    mantener la seguridad y prevenir spam. Puedes administrar
                    las cookies desde tu navegador. Bloquearlas puede afectar
                    algunas funciones del sitio. Cualquier uso adicional de
                    herramientas de publicidad o seguimiento deberá reflejarse
                    en esta política y en las opciones de privacidad
                    correspondientes.
                  </p>
                }
                en={
                  <p>
                    The site and its providers may use cookies or similar
                    technologies to enable its operation, maintain security,
                    and prevent spam. You can manage cookies through your
                    browser. Blocking them may affect some site features. Any
                    additional use of advertising or tracking tools must be
                    reflected in this policy and the corresponding privacy
                    options.
                  </p>
                }
              />
            </div>
          </section>

          {/* 6. Conservación */}
          <section id="section-6">
            <h2 className="text-xl font-semibold text-foreground mb-3">
              6.{" "}
              <LocalizedText
                es="Conservación y seguridad"
                en="Retention and security"
              />
            </h2>
            <div className="text-foreground/75 space-y-3 leading-relaxed">
              <LocalizedContent
                es={
                  <p>
                    Conservamos la información durante el tiempo necesario para
                    atender solicitudes, prestar servicios, mantener registros
                    de consentimiento y cumplir obligaciones legales o resolver
                    controversias. Aplicamos medidas razonables para proteger
                    la información. Ningún sistema de almacenamiento o
                    transmisión por internet garantiza seguridad absoluta.
                  </p>
                }
                en={
                  <p>
                    We retain information for as long as necessary to address
                    requests, provide services, maintain consent records, and
                    comply with legal obligations or resolve disputes. We apply
                    reasonable measures to protect information. No internet
                    storage or transmission system guarantees absolute
                    security.
                  </p>
                }
              />
            </div>
          </section>

          {/* 7. Tus opciones */}
          <section id="section-7">
            <h2 className="text-xl font-semibold text-foreground mb-3">
              7.{" "}
              <LocalizedText es="Tus opciones" en="Your choices" />
            </h2>
            <div className="text-foreground/75 space-y-3 leading-relaxed">
              <LocalizedContent
                es={
                  <p>
                    Puedes solicitar acceso, corrección o eliminación de tu
                    información mediante los datos de contacto indicados abajo.
                    Atenderemos las solicitudes conforme a la legislación
                    aplicable, verificando tu identidad cuando corresponda.
                    Podremos conservar información cuando sea necesaria para
                    cumplir obligaciones legales o respetar tu solicitud de no
                    recibir más mensajes.
                  </p>
                }
                en={
                  <p>
                    You may request access to, correction of, or deletion of
                    your information using the contact details below. We will
                    address requests in accordance with applicable law,
                    verifying your identity when appropriate. We may retain
                    information when necessary to comply with legal obligations
                    or honor your request to stop receiving messages.
                  </p>
                }
              />
            </div>
          </section>

          {/* 8. Enlaces externos */}
          <section id="section-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">
              8.{" "}
              <LocalizedText es="Enlaces externos" en="External links" />
            </h2>
            <div className="text-foreground/75 space-y-3 leading-relaxed">
              <LocalizedContent
                es={
                  <p>
                    Nuestro sitio puede incluir enlaces a plataformas externas.
                    Sus prácticas de privacidad se rigen por sus propias
                    políticas.
                  </p>
                }
                en={
                  <p>
                    Our site may include links to external platforms. Their
                    privacy practices are governed by their own policies.
                  </p>
                }
              />
            </div>
          </section>

          {/* 9. Cambios */}
          <section id="section-9">
            <h2 className="text-xl font-semibold text-foreground mb-3">
              9.{" "}
              <LocalizedText
                es="Cambios en esta política"
                en="Changes to this policy"
              />
            </h2>
            <div className="text-foreground/75 space-y-3 leading-relaxed">
              <LocalizedContent
                es={
                  <p>
                    Publicaremos cualquier actualización en esta página e
                    indicaremos la fecha de revisión. Si un cambio requiere
                    una nueva autorización, la solicitaremos antes de utilizar
                    tus datos para ese propósito.
                  </p>
                }
                en={
                  <p>
                    We will publish any updates on this page and indicate the
                    revision date. If a change requires new authorization, we
                    will request it before using your data for that purpose.
                  </p>
                }
              />
            </div>
          </section>

          {/* 10. Contacto */}
          <section id="section-10">
            <h2 className="text-xl font-semibold text-foreground mb-3">
              10.{" "}
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
            href="/terms"
            className="text-sm text-foreground/60 hover:text-foreground transition-colors"
          >
            <LocalizedText
              es="Ver Términos y condiciones →"
              en="View Terms and Conditions →"
            />
          </Link>
        </div>
      </div>
    </main>
  );
}
