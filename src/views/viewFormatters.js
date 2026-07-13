export const formatCurrency = (value) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(Number(value || 0));

export const formatProductName = (value) => {
  const name = String(value || '').trim();
  if (!name) return '';
  return name.charAt(0).toLocaleUpperCase('es-ES') + name.slice(1);
};
