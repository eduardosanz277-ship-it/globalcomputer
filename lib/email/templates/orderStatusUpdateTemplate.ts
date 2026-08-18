import type { EmailLocale } from "@/lib/email/order-confirmation-locale";
import { EMAIL_BRAND_NAME } from "@/lib/email/email-brand";
import { wrapBrandedEmail } from "@/lib/email/templates/brandedEmailShell";
import {
  renderOrderTransactionalEmailBody,
  type OrderEmailBodyCopy,
  type OrderEmailLineItem,
} from "@/lib/email/templates/orderEmailBlocks";

export type OrderStatusEmailKind =
  | "processing"
  | "shipping"
  | "completed"
  | "cancelled";

export type OrderStatusUpdateTemplateInput = {
  locale: EmailLocale;
  status: OrderStatusEmailKind;
  customerName: string;
  orderNumber: string;
  orderDate: string;
  items: OrderEmailLineItem[];
  amountSubtotal: number;
  amountDiscount: number;
  amountTax: number;
  amountShipping: number;
  totalAmount: number;
  shippingAddressLines: string[];
  orderLookupUrl: string;
  profileOrdersUrl?: string | null;
};

type StatusCopy = OrderEmailBodyCopy & {
  preheader: (orderNumber: string) => string;
  subject: (orderNumber: string) => string;
  bannerSubtitle: string;
};

const SHARED_ES = {
  fallbackName: "Cliente",
  fallbackProduct: "Producto",
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
  ctaSecondary: "Ver en mi cuenta",
} as const;

const SHARED_EN = {
  fallbackName: "Customer",
  fallbackProduct: "Product",
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
  ctaSecondary: "View in my account",
} as const;

function copyEs(status: OrderStatusEmailKind): StatusCopy {
  if (status === "processing") {
    return {
      ...SHARED_ES,
      preheader: (orderNumber) =>
        `Tu pedido ${orderNumber} ya está en preparación. Te avisaremos cuando salga.`,
      subject: (orderNumber) => `Estamos preparando tu pedido — ${orderNumber}`,
      bannerSubtitle: "Pedido en preparación",
      intro: (name) =>
        `Hola ${name}, tu pedido ya está en nuestras manos y el equipo lo está preparando.`,
      nextStepsTitle: "¿Qué sigue ahora?",
      nextStepsBody:
        "Revisamos cada artículo, lo empacamos con cuidado y te escribimos de nuevo cuando salga hacia tu dirección. No necesitas hacer nada más por ahora.",
      ctaPrimary: "Consultar mi pedido",
    };
  }

  if (status === "shipping") {
    return {
      ...SHARED_ES,
      preheader: (orderNumber) =>
        `Tu pedido ${orderNumber} ya salió hacia la dirección de envío.`,
      subject: (orderNumber) => `Tu pedido va en camino — ${orderNumber}`,
      bannerSubtitle: "Pedido enviado",
      intro: (name) =>
        `Hola ${name}, buenas noticias: tu pedido ya está en camino.`,
      nextStepsTitle: "¿Qué sigue ahora?",
      nextStepsBody:
        "Lo enviamos a la dirección que indicaste. Conserva tu número de pedido para consultar el estado cuando quieras. Si tarda más de lo habitual, escríbenos y lo revisamos contigo.",
      ctaPrimary: "Seguir mi pedido",
    };
  }

  if (status === "completed") {
    return {
      ...SHARED_ES,
      preheader: (orderNumber) =>
        `Tu pedido ${orderNumber} está completo. Gracias por comprar con nosotros.`,
      subject: (orderNumber) => `Tu pedido se completó — ${orderNumber}`,
      bannerSubtitle: "Pedido completado",
      intro: (name) =>
        `Hola ${name}, tu pedido ya figura como completado. Esperamos que todo haya llegado en buen estado.`,
      nextStepsTitle: "¿Necesitas algo más?",
      nextStepsBody:
        `Si algún artículo no coincide o necesitas ayuda con un producto, contáctanos con tu número de pedido. Gracias por confiar en ${EMAIL_BRAND_NAME}.`,
      ctaPrimary: "Ver mi pedido",
    };
  }

  return {
    ...SHARED_ES,
    preheader: (orderNumber) =>
      `El pedido ${orderNumber} fue cancelado y no se enviará.`,
    subject: (orderNumber) => `Tu pedido fue cancelado — ${orderNumber}`,
    bannerSubtitle: "Pedido cancelado",
    intro: (name) =>
      `Hola ${name}, te confirmamos que este pedido fue cancelado y no se enviará.`,
    nextStepsTitle: "¿Qué implica esto?",
    nextStepsBody:
      "No se realizará el envío de estos productos. Si no pediste la cancelación o hay un cobro que revisar, responde a este correo o llama a soporte con tu número de pedido. Estamos para ayudarte.",
    ctaPrimary: "Ver detalles del pedido",
  };
}

function copyEn(status: OrderStatusEmailKind): StatusCopy {
  if (status === "processing") {
    return {
      ...SHARED_EN,
      preheader: (orderNumber) =>
        `Your order ${orderNumber} is being prepared. We'll email you when it ships.`,
      subject: (orderNumber) => `We're preparing your order — ${orderNumber}`,
      bannerSubtitle: "Order in preparation",
      intro: (name) =>
        `Hi ${name}, your order is with our team and we're getting it ready.`,
      nextStepsTitle: "What happens next?",
      nextStepsBody:
        "We check each item, pack it carefully, and email you again when it leaves for your address. There's nothing you need to do right now.",
      ctaPrimary: "Track my order",
    };
  }

  if (status === "shipping") {
    return {
      ...SHARED_EN,
      preheader: (orderNumber) =>
        `Your order ${orderNumber} is on its way to your shipping address.`,
      subject: (orderNumber) => `Your order is on the way — ${orderNumber}`,
      bannerSubtitle: "Order shipped",
      intro: (name) =>
        `Hi ${name}, good news: your order is on its way.`,
      nextStepsTitle: "What happens next?",
      nextStepsBody:
        "We sent it to the address you provided. Keep your order number handy to check status anytime. If it takes longer than usual, write to us and we'll look into it with you.",
      ctaPrimary: "Track my order",
    };
  }

  if (status === "completed") {
    return {
      ...SHARED_EN,
      preheader: (orderNumber) =>
        `Your order ${orderNumber} is complete. Thank you for shopping with us.`,
      subject: (orderNumber) => `Your order is complete — ${orderNumber}`,
      bannerSubtitle: "Order completed",
      intro: (name) =>
        `Hi ${name}, your order is now marked as complete. We hope everything arrived in good condition.`,
      nextStepsTitle: "Need anything else?",
      nextStepsBody:
        `If an item doesn't match or you need help with a product, contact us with your order number. Thank you for trusting ${EMAIL_BRAND_NAME}.`,
      ctaPrimary: "View my order",
    };
  }

  return {
    ...SHARED_EN,
    preheader: (orderNumber) =>
      `Order ${orderNumber} was cancelled and will not be shipped.`,
    subject: (orderNumber) => `Your order was cancelled — ${orderNumber}`,
    bannerSubtitle: "Order cancelled",
    intro: (name) =>
      `Hi ${name}, we're confirming that this order was cancelled and will not be shipped.`,
    nextStepsTitle: "What this means",
    nextStepsBody:
      "These products will not be shipped. If you didn't request the cancellation or need us to review a charge, reply to this email or call support with your order number. We're here to help.",
    ctaPrimary: "View order details",
  };
}

function copy(locale: EmailLocale, status: OrderStatusEmailKind): StatusCopy {
  return locale === "es" ? copyEs(status) : copyEn(status);
}

export function orderStatusUpdateTemplateId(
  locale: EmailLocale,
  status: OrderStatusEmailKind,
): string {
  return `order-status-${status}-${locale}`;
}

export function renderOrderStatusUpdateEmailSubject(
  input: Pick<OrderStatusUpdateTemplateInput, "locale" | "status" | "orderNumber">,
): string {
  return copy(input.locale, input.status).subject(input.orderNumber);
}

export function renderOrderStatusUpdateEmailTemplate(
  input: OrderStatusUpdateTemplateInput,
): string {
  const t = copy(input.locale, input.status);

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
  });
}
