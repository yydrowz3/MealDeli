export type MoneyParseResult =
  | Readonly<{ ok: true; minor: number }>
  | Readonly<{ ok: false; message: string }>;

export function parseUsdToMinor(input: string): MoneyParseResult {
  const value = input.trim();
  const match = /^(0|[1-9]\d*)(?:\.(\d{1,2}))?$/.exec(value);
  if (!match) {
    return { ok: false, message: "Enter a non-negative amount with up to 2 decimals." };
  }
  const dollars = Number(match[1]);
  const cents = Number((match[2] ?? "").padEnd(2, "0"));
  if (!Number.isSafeInteger(dollars) || dollars > Math.floor(Number.MAX_SAFE_INTEGER / 100)) {
    return { ok: false, message: "Amount is too large." };
  }
  const minor = dollars * 100 + cents;
  return Number.isSafeInteger(minor)
    ? { ok: true, minor }
    : { ok: false, message: "Amount is too large." };
}

export function formatMinorForInput(minor: number): string {
  const dollars = Math.floor(minor / 100);
  const cents = String(minor % 100).padStart(2, "0");
  return `${dollars}.${cents}`;
}
