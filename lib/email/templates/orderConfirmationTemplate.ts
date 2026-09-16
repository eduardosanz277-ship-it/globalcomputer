import {
  orderConfirmationTemplateId,
  type EmailLocale,
} from "@/lib/email/order-confirmation-locale";
import { wrapBrandedEmail, type BrandedEmailFooterContact } from "@/lib/email/templates/brandedEmailShell";
import {
  renderOrderTransactionalEmailBody,
  type OrderEmailBodyCopy,
  type OrderEmailLineItem,
} from "@/lib/email/templates/orderEmailBlocks";

export type OrderConfirmationLineItem = OrderEmailLineItem;

export type OrderConfirmationTemplateInput = {
  locale: EmailLocale;
  customerName: string;
  orderNumber: string;
  orderDate: string;
  items: OrderConfirmationLineItem[];
  amountSubtotal: number;
  amountDiscount: number;
  amountTax: number;
  amountShipping: number;
  totalAmount: number;
  shippingAddressLines: string[];
  orderLookupUrl: string;
  profileOrdersUrl?: string | null;
  footerContact?: BrandedEmailFooterContact;
};

function copy(locale: EmailLocale): OrderEmailBodyCopy & {
  preheader: (orderNumber: string) => string;
  subject: (orderNumber: string) => string;
  bannerSubtitle: string;
} {
  if (locale === "es") {
    return {
      preheader: (orderNumber: string) =>
        `Tu pedido ${orderNumber} está confirmado. Ya estamos preparándolo.`,
      subject: (orderNumber: string) => `Pedido confirmado — ${orderNumber}`,
      bannerSubtitle: "Pedido confirmado",
      fallbackName: "Cliente",
      fallbackProduct: "Producto",
      intro: (name: string) =>
        `Hola ${name}, hemos recibido tu pago y tu pedido ya está confirmado.`,
      orderNumberLabel: "Nº de pedido",
      orderDateLabel: "Fecha",
      summaryTitle: "Resumen del pedido",
      qtyLabel: "Cant.",
      subtotal: "Subtotal",
      discount: "Descuento",
      tax: "Impuestos",
      shipping: "Envío",
      total: "Total",
      shippingTitle: "Dirección de envío",
      nextStepsTitle: "¿Qué sigue ahora?",
      nextStepsBody:
        "Te avisaremos por correo cuando tu pedido avance al siguiente estado. Puedes consultar el estado y el historial en cualquier momento con tu número de pedido y correo.",
      ctaPrimary: "Consultar mi pedido",
      ctaSecondary: "Ver en mi cuenta",
    };
  }

  return {
    preheader: (orderNumber: string) =>
      `Your order ${orderNumber} is confirmed. We're preparing it for you.`,
    subject: (orderNumber: string) => `Order confirmed — ${orderNumber}`,
    bannerSubtitle: "Order confirmed",
    fallbackName: "Customer",
    fallbackProduct: "Product",
    intro: (name: string) =>
      `Hi ${name}, we've received your payment and your order is confirmed.`,
    orderNumberLabel: "Order number",
    orderDateLabel: "Date",
    summaryTitle: "Order summary",
    qtyLabel: "Qty",
    subtotal: "Subtotal",
    discount: "Discount",
    tax: "Tax",
    shipping: "Shipping",
    total: "Total",
    shippingTitle: "Shipping address",
    nextStepsTitle: "What happens next?",
    nextStepsBody:
      "We'll email you when your order moves to the next stage. You can track status and history anytime with your order number and email.",
    ctaPrimary: "Track my order",
    ctaSecondary: "View in my account",
  };
}

export function renderOrderConfirmationEmailSubject(
  input: Pick<OrderConfirmationTemplateInput, "locale" | "orderNumber">,
): string {
  return copy(input.locale).subject(input.orderNumber);
}

export function resolveOrderConfirmationTemplateId(
  locale: EmailLocale,
): string {
  return orderConfirmationTemplateId(locale);
}

export function renderOrderConfirmationEmailTemplate(
  input: OrderConfirmationTemplateInput,
): string {
  const t = copy(input.locale);

  return wrapBrandedEmail({
    locale: input.locale,
    title: t.subject(input.orderNumber),
    bannerSubtitle: t.bannerSubtitle,
    preheader: t.preheader(input.orderNumber),
    bodyHtml: renderOrderTransactionalEmailBody({
      copy: t,
      customerName: input.customerName,
      orderNumber: input.orderNumber,
      orderDate: input.orderDate,
      items: input.items,
      amountSubtotal: input.amountSubtotal,
      amountDiscount: input.amountDiscount,
      amountTax: input.amountTax,
      amountShipping: input.amountShipping,
      totalAmount: input.totalAmount,
      shippingAddressLines: input.shippingAddressLines,
      orderLookupUrl: input.orderLookupUrl,
      profileOrdersUrl: input.profileOrdersUrl,
    }),
    footerContact: input.footerContact,
  });
}
