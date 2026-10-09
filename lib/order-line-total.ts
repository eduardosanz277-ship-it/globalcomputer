/** Total de línea sin impuestos: cantidad × precio unitario. */
export function orderLineTotalWithoutTax(item: {
  quantity: number;
  unitPrice?: number;
  unit_price?: string | number;
}): number {
  const unit = Number(item.unitPrice ?? item.unit_price ?? 0);
  const qty = Number(item.quantity ?? 0);
  if (!Number.isFinite(unit) || !Number.isFinite(qty)) return 0;
  return Number((unit * qty).toFixed(2));
}
