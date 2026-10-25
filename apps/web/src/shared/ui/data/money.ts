export function formatUsd(minor: number, locale = "en-US"): string {
  if (!Number.isSafeInteger(minor)) {
    throw new TypeError("USD minor units must be a safe integer.");
  }

  const value = BigInt(minor);
  if (locale !== "en-US" && locale !== "en") {
    // Keep integer dollars as BigInt so even large values retain exact cents.
    const absolute = value < 0n ? -value : value;
    const integer = value / 100n;
    const amount = integer === 0n && value < 0n ? -0 : integer;
    return new Intl.NumberFormat(locale, { style: "currency", currency: "USD" })
      .formatToParts(amount)
      .map((part) =>
        part.type === "fraction" ? (absolute % 100n).toString().padStart(2, "0") : part.value,
      )
      .join("");
  }
  const absolute = value < 0n ? -value : value;
  const dollars = (absolute / 100n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const cents = (absolute % 100n).toString().padStart(2, "0");
  return `${value < 0n ? "-" : ""}$${dollars}.${cents}`;
}
