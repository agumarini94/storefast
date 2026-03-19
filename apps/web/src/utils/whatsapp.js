/**
 * Genera un link de WhatsApp con el detalle del producto/pedido.
 */
export function buildWhatsAppLink({ phone, storeName, productName, price, variant }) {
  const variantPart = variant ? ` — *${variant}*` : '';
  const message = `Hola! Vi *${productName}*${variantPart} en ${storeName} por ₪${price}. ¿Está disponible?`;
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${phone}?text=${encoded}`;
}

export function buildOrderLink({ phone, storeName, items }) {
  const list = items.map(i => `• ${i.name} x${i.qty} – $${i.price}`).join('\n');
  const message = `Hola! Quiero hacer un pedido en *${storeName}*:\n\n${list}\n\n¿Me podés confirmar disponibilidad?`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
