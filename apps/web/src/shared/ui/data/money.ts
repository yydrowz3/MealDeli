export function formatUsd(minor: number): string {
  if (!Number.isSafeInteger(minor)) {
    throw new TypeError("USD minor units must be a safe integer.");
  }

  const value = BigInt(minor);
  const absolute = value < 0n ? -value : value;
  const dollars = (absolute / 100n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const cents = (absolute % 100n).toString().padStart(2, "0");
  return `${value < 0n ? "-" : ""}$${dollars}.${cents}`;
}
