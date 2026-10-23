export type DateTimeFormatOptions = {
  locale?: string;
  timeZone?: string;
};

export function toValidDate(value: string | Date): Date {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new RangeError("Date value must be valid.");
  }
  return date;
}

export function formatDateTime(value: string | Date, options: DateTimeFormatOptions = {}): string {
  const date = toValidDate(value);
  return new Intl.DateTimeFormat(options.locale ?? "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: options.timeZone,
  }).format(date);
}
