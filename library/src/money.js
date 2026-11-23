export function availableLiquidity(wallets) {
  return wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
}

export function formatRupiah(amount) {
  const rounded = Math.round(amount);
  const body = Math.abs(rounded).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `Rp${rounded < 0 ? "-" : ""}${body}`;
}

export function formatSignedRupiah(amount) {
  if (amount > 0) return `+${formatRupiah(amount)}`;
  return formatRupiah(amount);
}
