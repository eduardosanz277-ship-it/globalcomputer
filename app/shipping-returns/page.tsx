import type { Metadata } from "next";
import Link from "next/link";
import { LocalizedText } from "@/components/i18n/LocalizedText";
import { LocalizedContent } from "@/components/i18n/LocalizedContent";

export const metadata: Metadata = {
  title: "Envíos y devoluciones | Global Computers USA",
  description:
    "Información sobre el envío de pedidos y cómo solicitar una devolución en Global Computers USA.",
};

const SALES_EMAIL = "globalcomputerusasales@gmail.com";

function SalesEmailLink() {
  return (
    <a
      href={`mailto:${SALES_EMAIL}`}
      className="underline underline-offset-4 hover:text-foreground transition-colors"
    >
      {SALES_EMAIL}
    </a>
  );
}

export default function ShippingReturnsPage() {
  return (
    <main className="min-h-[60vh] bg-gradient-to-b from-muted/30 via-background to-background">
      <div className="border-b border-border/60 bg-card/40">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            <LocalizedText
              es="Envíos y devoluciones"
              en="Shipping and returns"
            />
          </h1>
          <p className="mt-4 text-base text-foreground/70 max-w-2xl">
            <LocalizedText
              es="En Global Computers USA ofrecemos cámaras de seguridad, alarmas, sistemas de control de acceso y accesorios. A continuación, encontrarás información sobre el envío de tus pedidos y cómo solicitar una devolución."
              en="Global Computers USA offers security cameras, alarms, access control systems, and accessories. Below you will find information about shipping your orders and how to request a return."
            />
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="space-y-10 [&_section]:scroll-mt-20">
          <section id="shipping">
            <h2 className="text-xl font-semibold text-foreground mb-3">
              1. <LocalizedText es="Envíos" en="Shipping" />
            </h2>
            <div className="text-foreground/75 space-y-3 leading-relaxed">
              <LocalizedContent
                es={
                  <>
                    <p>
                      Realizamos envíos únicamente dentro de Estados Unidos. El
                      costo del envío se muestra al finalizar la compra, antes
                      de confirmar el pago.
                    </p>
                    <p className="mt-3">
                      Los pedidos se preparan para su envío en un plazo de 1
                      día hábil, excluyendo fines de semana y feriados. Este
                      plazo corresponde únicamente a la preparación del pedido;
                      el tiempo de entrega dependerá del destino y de la
                      empresa de transporte.
                    </p>
                    <p className="mt-3">
                      Los pedidos se envían mediante una empresa de transporte
                      seleccionada por Global Computers USA.
                    </p>
                    <p className="mt-3">
                      Una vez enviado tu pedido, recibirás un correo
                      electrónico con el número de seguimiento para consultar
                      el estado de la entrega.
                    </p>
                    <p className="mt-3">
                      Si no podemos despachar tu pedido en el plazo anunciado,
                      te notificaremos por correo electrónico dentro de ese
                      plazo, te informaremos la nueva fecha de despacho
                      prevista, si está disponible, y te ofreceremos la opción
                      de aceptar el retraso o cancelar con reembolso. El aviso
                      explicará cómo comunicar tu decisión y qué ocurrirá si no
                      respondes, de acuerdo con los requisitos legales
                      aplicables.
                    </p>
                    <p className="mt-3">
                      Si cancelas un pedido completo por un retraso de despacho
                      y ningún artículo ha sido enviado, emitiremos un
                      reembolso completo, incluidos los gastos de envío y los
                      impuestos cobrados, dentro de los 7 días hábiles
                      siguientes a la cancelación. Este reembolso no está
                      sujeto al proceso de inspección de devoluciones.
                    </p>
                    <p className="mt-3">
                      Revisa que tu dirección de envío y tus datos de contacto
                      sean correctos antes de completar la compra. Si necesitas
                      corregirlos, comunícate con nosotros lo antes posible. Si
                      el pedido ya fue enviado, es posible que no podamos
                      modificar la dirección.
                    </p>
                  </>
                }
                en={
                  <>
                    <p>
                      We ship only within the United States. The shipping cost
                      is shown at checkout, before you confirm payment.
                    </p>
                    <p className="mt-3">
                      Orders are prepared for shipment within 1 business day,
                      excluding weekends and holidays. This period covers order
                      preparation only; delivery time depends on the
                      destination and the carrier.
                    </p>
                    <p className="mt-3">
                      Orders are shipped through a carrier selected by Global
                      Computers USA.
                    </p>
                    <p className="mt-3">
                      Once your order has shipped, you will receive an email
                      with the tracking number so you can check the delivery
                      status.
                    </p>
                    <p className="mt-3">
                      If we cannot ship your order within the stated time, we
                      will notify you by email within that period, tell you the
                      new expected ship date if it is available, and offer you
                      the option to accept the delay or cancel for a refund.
                      The notice will explain how to communicate your decision
                      and what happens if you do not respond, in accordance
                      with applicable legal requirements.
                    </p>
                    <p className="mt-3">
                      If you cancel an entire order because of a shipping delay
                      and no item has been shipped, we will issue a full
                      refund, including shipping charges and taxes collected,
                      within 7 business days of the cancellation. This refund
                      is not subject to the return inspection process.
                    </p>
                    <p className="mt-3">
                      Check that your shipping address and contact details are
                      correct before you complete the purchase. If you need to
                      correct them, contact us as soon as possible. If the
                      order has already shipped, we may not be able to change
                      the address.
                    </p>
                  </>
                }
              />
            </div>
          </section>

          <section id="change-of-mind">
            <h2 className="text-xl font-semibold text-foreground mb-3">
              2.{" "}
              <LocalizedText
                es="Devoluciones por cambio de opinión o error al seleccionar el producto"
                en="Returns for a change of mind or a product selection error"
              />
            </h2>
            <div className="text-foreground/75 space-y-3 leading-relaxed">
              <LocalizedContent
                es={
                  <>
                    <p>
                      Dispones de 30 días a partir de la recepción de tu
                      artículo para solicitar una devolución por cambio de
                      opinión o por un error al seleccionar el producto.
                    </p>
                    <p className="mt-3">
                      Para ser elegible, el artículo debe estar sin usar ni
                      instalar, con sus etiquetas y en su embalaje original, e
                      incluir todos los accesorios, piezas y manuales
                      recibidos. También necesitarás el recibo o comprobante de
                      compra.
                    </p>
                    <p className="mt-3">
                      Para iniciar una devolución, escribe a <SalesEmailLink />{" "}
                      e incluye:
                    </p>
                    <ul className="list-disc pl-6 space-y-1 mt-2">
                      <li>Tu número de pedido.</li>
                      <li>El artículo que deseas devolver.</li>
                      <li>El motivo de la devolución.</li>
                    </ul>
                    <p className="mt-3">
                      Si tu solicitud es aprobada, te enviaremos un correo
                      electrónico confirmando la aceptación de la devolución,
                      junto con la dirección de envío y las instrucciones para
                      realizarla.
                    </p>
                    <p className="mt-3">
                      Deberás entregar el paquete a la empresa de transporte
                      dentro de los 3 días naturales siguientes a la
                      autorización. Este plazo corresponde al envío del
                      paquete, no a su llegada a nuestras instalaciones.
                      Conserva tu comprobante de envío y número de seguimiento.
                    </p>
                    <p className="mt-3">
                      El cliente pagará el envío de devolución cuando cambie de
                      opinión o seleccione un producto equivocado. El costo del
                      envío original no es reembolsable en estos casos.
                    </p>
                    <p className="mt-3">
                      No cobramos cargos adicionales por reposición de
                      inventario ni por revisión del artículo.
                    </p>
                    <p className="mt-3">
                      Las devoluciones por estos motivos requieren autorización
                      previa.
                    </p>
                  </>
                }
                en={
                  <>
                    <p>
                      You have 30 days from receipt of your item to request a
                      return because you changed your mind or selected the
                      wrong product.
                    </p>
                    <p className="mt-3">
                      To be eligible, the item must be unused and uninstalled,
                      with its tags and in its original packaging, and it must
                      include all accessories, parts, and manuals received. You
                      will also need the receipt or proof of purchase.
                    </p>
                    <p className="mt-3">
                      To start a return, email <SalesEmailLink /> and include:
                    </p>
                    <ul className="list-disc pl-6 space-y-1 mt-2">
                      <li>Your order number.</li>
                      <li>The item you want to return.</li>
                      <li>The reason for the return.</li>
                    </ul>
                    <p className="mt-3">
                      If your request is approved, we will email you confirming
                      that the return was accepted, along with the shipping
                      address and instructions.
                    </p>
                    <p className="mt-3">
                      You must hand the package to the carrier within 3
                      calendar days of authorization. This period is for
                      shipping the package, not for its arrival at our
                      facilities. Keep your shipping receipt and tracking
                      number.
                    </p>
                    <p className="mt-3">
                      The customer pays return shipping when they change their
                      mind or select the wrong product. The original shipping
                      cost is not refundable in these cases.
                    </p>
                    <p className="mt-3">
                      We do not charge extra restocking or item inspection
                      fees.
                    </p>
                    <p className="mt-3">
                      Returns for these reasons require prior authorization.
                    </p>
                  </>
                }
              />
            </div>
          </section>

          <section id="damaged-defective">
            <h2 className="text-xl font-semibold text-foreground mb-3">
              3.{" "}
              <LocalizedText
                es="Artículos dañados, defectuosos o incorrectos"
                en="Damaged, defective, or incorrect items"
              />
            </h2>
            <div className="text-foreground/75 space-y-3 leading-relaxed">
              <LocalizedContent
                es={
                  <>
                    <p>
                      Revisa tu pedido al recibirlo. Si algún artículo llega
                      dañado, presenta un defecto o no corresponde a lo que
                      compraste, contáctanos lo antes posible en{" "}
                      <SalesEmailLink /> para evaluar el caso.
                    </p>
                    <p className="mt-3">
                      Incluye tu número de pedido, una descripción del problema
                      y, cuando sea posible, fotografías del artículo y del
                      embalaje. Conserva el embalaje y los accesorios
                      disponibles para facilitar la revisión.
                    </p>
                    <p className="mt-3">
                      Si confirmamos que enviamos un artículo incorrecto o que
                      el producto llegó dañado o defectuoso, Global Computers
                      USA cubrirá los costos razonables del envío de
                      devolución. Nos comunicaremos contigo para coordinar la
                      solución correspondiente, que podrá incluir reparación,
                      reemplazo o reembolso, según el caso, la garantía y la
                      legislación aplicable.
                    </p>
                    <p className="mt-3">
                      Antes de enviar el artículo, contáctanos para recibir las
                      instrucciones de devolución.
                    </p>
                    <p className="mt-3">
                      Si el equipo ya fue instalado y presenta una falla,
                      comunícate con nosotros para revisar las opciones de
                      soporte, garantía y demás derechos aplicables. La
                      instalación o el uso del producto no excluyen por sí
                      solos una reclamación válida por defecto.
                    </p>
                    <p className="mt-3">
                      Los plazos de 30 días para solicitar la devolución y de 3
                      días naturales para enviar el paquete corresponden
                      únicamente a devoluciones por cambio de opinión o error
                      del cliente al seleccionar el producto. No limitan los
                      derechos legales ni las garantías aplicables a productos
                      defectuosos, dañados o incorrectos.
                    </p>
                  </>
                }
                en={
                  <>
                    <p>
                      Check your order when you receive it. If an item arrives
                      damaged, is defective, or is not what you purchased,
                      contact us as soon as possible at <SalesEmailLink /> so
                      we can review the case.
                    </p>
                    <p className="mt-3">
                      Include your order number, a description of the problem,
                      and, when possible, photos of the item and the packaging.
                      Keep the packaging and available accessories to make the
                      review easier.
                    </p>
                    <p className="mt-3">
                      If we confirm that we sent the wrong item or that the
                      product arrived damaged or defective, Global Computers
                      USA will cover reasonable return shipping costs. We will
                      contact you to arrange the appropriate solution, which
                      may include repair, replacement, or a refund, depending
                      on the case, the warranty, and applicable law.
                    </p>
                    <p className="mt-3">
                      Contact us for return instructions before you send the
                      item.
                    </p>
                    <p className="mt-3">
                      If the equipment has already been installed and it fails,
                      contact us to review support options, the warranty, and
                      other applicable rights. Installation or use of the
                      product does not by itself exclude a valid defect claim.
                    </p>
                    <p className="mt-3">
                      The 30-day period to request a return and the 3 calendar
                      days to ship the package apply only to returns for a
                      change of mind or a customer product-selection error.
                      They do not limit legal rights or warranties that apply
                      to defective, damaged, or incorrect products.
                    </p>
                  </>
                }
              />
            </div>
          </section>

          <section id="refunds">
            <h2 className="text-xl font-semibold text-foreground mb-3">
              4.{" "}
              <LocalizedText
                es="Reembolsos por devoluciones"
                en="Refunds for returns"
              />
            </h2>
            <div className="text-foreground/75 space-y-3 leading-relaxed">
              <LocalizedContent
                es={
                  <>
                    <p>
                      Una vez recibido el artículo devuelto, lo inspeccionaremos
                      y te notificaremos por correo electrónico si el reembolso
                      fue aprobado o rechazado en un plazo de 7 días hábiles.
                      Si se rechaza, te explicaremos el motivo.
                    </p>
                    <p className="mt-3">
                      Si se aprueba, procesaremos el reembolso al mismo método
                      de pago utilizado en la compra dentro de los 7 días
                      hábiles siguientes a su aprobación. La revisión y el
                      procesamiento pueden sumar hasta 14 días hábiles desde la
                      recepción del artículo, salvo que corresponda un plazo
                      menor conforme a la legislación aplicable.
                    </p>
                    <p className="mt-3">
                      En las devoluciones por cambio de opinión o error del
                      cliente al seleccionar el producto, se reembolsará el
                      importe correspondiente a los artículos aceptados y los
                      impuestos aplicables, excluyendo el costo del envío
                      original.
                    </p>
                    <p className="mt-3">
                      En los casos de productos dañados, defectuosos o
                      incorrectos, el reembolso y los gastos de envío
                      correspondientes se determinarán conforme a la solución
                      acordada y los derechos legales aplicables.
                    </p>
                    <p className="mt-3">
                      El tiempo adicional para que el dinero se refleje en tu
                      cuenta dependerá de tu banco o del emisor de tu tarjeta.
                    </p>
                  </>
                }
                en={
                  <>
                    <p>
                      Once we receive the returned item, we will inspect it and
                      email you within 7 business days to say whether the
                      refund was approved or denied. If it is denied, we will
                      explain why.
                    </p>
                    <p className="mt-3">
                      If it is approved, we will process the refund to the same
                      payment method used for the purchase within 7 business
                      days of approval. Review and processing may total up to
                      14 business days from receipt of the item, unless a
                      shorter period applies under applicable law.
                    </p>
                    <p className="mt-3">
                      For returns due to a change of mind or a customer
                      product-selection error, we will refund the amount for
                      the accepted items and applicable taxes, excluding the
                      original shipping cost.
                    </p>
                    <p className="mt-3">
                      For damaged, defective, or incorrect products, the refund
                      and related shipping costs will be determined according
                      to the agreed solution and applicable legal rights.
                    </p>
                    <p className="mt-3">
                      Any additional time for the money to appear in your
                      account depends on your bank or card issuer.
                    </p>
                  </>
                }
              />
            </div>
          </section>

          <section id="consumer-rights">
            <h2 className="text-xl font-semibold text-foreground mb-3">
              5.{" "}
              <LocalizedText
                es="Derechos del consumidor"
                en="Consumer rights"
              />
            </h2>
            <div className="text-foreground/75 space-y-3 leading-relaxed">
              <LocalizedContent
                es={
                  <p>
                    Esta política no limita los derechos ni las garantías que
                    correspondan al consumidor conforme a la legislación
                    aplicable. Si alguna condición entra en conflicto con una
                    obligación legal, prevalecerá dicha obligación.
                  </p>
                }
                en={
                  <p>
                    This policy does not limit the rights or warranties that
                    apply to the consumer under applicable law. If any
                    condition conflicts with a legal obligation, that
                    obligation prevails.
                  </p>
                }
              />
            </div>
          </section>

          <section id="contact">
            <h2 className="text-xl font-semibold text-foreground mb-3">
              6. <LocalizedText es="Contacto" en="Contact" />
            </h2>
            <div className="text-foreground/75 space-y-3 leading-relaxed">
              <LocalizedContent
                es={
                  <p>
                    Si tienes preguntas sobre un envío, una devolución o un
                    reembolso, escríbenos a <SalesEmailLink />.
                  </p>
                }
                en={
                  <p>
                    If you have questions about a shipment, a return, or a
                    refund, email us at <SalesEmailLink />.
                  </p>
                }
              />
            </div>
          </section>
        </div>

        <div className="mt-14 flex flex-wrap items-center gap-4 border-t border-border/60 pt-8">
          <Link
            href="/"
            className="text-sm text-foreground/60 hover:text-foreground transition-colors"
          >
            ← <LocalizedText es="Volver al inicio" en="Back to home" />
          </Link>
        </div>
      </div>
    </main>
  );
}
