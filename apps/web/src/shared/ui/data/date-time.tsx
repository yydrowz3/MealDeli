import { useI18n } from "../../i18n";
import type { HTMLAttributes } from "react";

import { formatDateTime, toValidDate } from "./date-time";
import type { DateTimeFormatOptions } from "./date-time";

export type DateTimeProps = Omit<HTMLAttributes<HTMLTimeElement>, "children"> &
  DateTimeFormatOptions & {
    value: string | Date;
    relativeLabel?: string;
  };

export function DateTime({ value, locale, timeZone, relativeLabel, ...props }: DateTimeProps) {
  const { text, locale: currentLocale } = useI18n();
  const date = toValidDate(value);
  return (
    <time {...props} dateTime={date.toISOString()}>
      {text(formatDateTime(date, { locale: locale ?? currentLocale, timeZone }))}
      {text(relativeLabel ? ` (${relativeLabel})` : null)}
    </time>
  );
}
