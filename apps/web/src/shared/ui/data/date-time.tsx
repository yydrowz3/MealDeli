import type { HTMLAttributes } from "react";

import { formatDateTime, toValidDate } from "./date-time";
import type { DateTimeFormatOptions } from "./date-time";

export type DateTimeProps = Omit<HTMLAttributes<HTMLTimeElement>, "children"> &
  DateTimeFormatOptions & {
    value: string | Date;
    relativeLabel?: string;
  };

export function DateTime({ value, locale, timeZone, relativeLabel, ...props }: DateTimeProps) {
  const date = toValidDate(value);
  return (
    <time {...props} dateTime={date.toISOString()}>
      {formatDateTime(date, { locale, timeZone })}
      {relativeLabel ? ` (${relativeLabel})` : null}
    </time>
  );
}
