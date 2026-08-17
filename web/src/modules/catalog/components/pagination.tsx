import { Button } from "../../../shared/ui";

export type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

function visiblePages(page: number, totalPages: number) {
  const first = Math.max(1, page - 2);
  const last = Math.min(totalPages, page + 2);
  return Array.from({ length: last - first + 1 }, (_, index) => first + index);
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Restaurant pages" className="catalog-pagination">
      <Button disabled={page <= 1} onClick={() => onPageChange(page - 1)} variant="secondary">
        Previous
      </Button>
      <div className="catalog-pagination__numbers">
        {visiblePages(page, totalPages).map((number) => (
          <Button
            aria-current={number === page ? "page" : undefined}
            key={number}
            onClick={() => onPageChange(number)}
            variant={number === page ? "primary" : "tertiary"}
          >
            {number}
          </Button>
        ))}
      </div>
      <span className="catalog-pagination__mobile-current" aria-live="polite">
        Page {page} of {totalPages}
      </span>
      <Button
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        variant="secondary"
      >
        Next
      </Button>
    </nav>
  );
}
