export type LocalDateBucket = Readonly<{
  date: string;
  start: Date;
  end: Date;
}>;

function formatLocalDate(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function localMidnight(year: number, month: number, day: number): Date {
  return new Date(year, month, day, 0, 0, 0, 0);
}

export function buildLocalDateBuckets(now: Date, days = 7): readonly LocalDateBucket[] {
  if (Number.isNaN(now.getTime())) throw new RangeError("The analytics clock must be valid.");
  if (!Number.isSafeInteger(days) || days < 1) {
    throw new RangeError("The bucket count must be a positive integer.");
  }

  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();
  return Array.from({ length: days }, (_, index) => {
    const start = localMidnight(year, month, day - (days - 1) + index);
    const end = localMidnight(start.getFullYear(), start.getMonth(), start.getDate() + 1);
    return { date: formatLocalDate(start), start, end };
  });
}

export function localDateFromKey(date: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) throw new RangeError("Local date keys must use YYYY-MM-DD.");
  const result = localMidnight(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (formatLocalDate(result) !== date) throw new RangeError("Local date key is invalid.");
  return result;
}
