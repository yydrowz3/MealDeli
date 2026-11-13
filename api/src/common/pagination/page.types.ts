import { PAGE_SIZE } from '@/common/pagination/page.constants';

export interface PageResult<T> {
  results: T[];
  totalResults: number;
  totalPages: number;
}

export function pageOffset(page: number): number {
  return (page - 1) * PAGE_SIZE;
}

export function toPageResult<T>(
  results: T[],
  totalResults: number,
): PageResult<T> {
  return {
    results,
    totalResults,
    totalPages: Math.ceil(totalResults / PAGE_SIZE),
  };
}
