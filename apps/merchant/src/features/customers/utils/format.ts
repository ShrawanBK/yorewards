export function maskPhone(phone: string): string {
  const trimmed = phone.trim();
  if (trimmed.length < 7) return trimmed;
  const start = trimmed.slice(0, 6);
  const end = trimmed.slice(-3);
  return `${start} XXX ${end}`;
}

export function formatSpend(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString()}`;
}
