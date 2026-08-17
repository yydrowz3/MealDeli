import { useEffect, useMemo, useState } from "react";

import { Button, DateTime, EmptyState, ErrorState, Modal, Skeleton } from "../../../shared/ui";
import { PromotionCard } from "../components/promotion-card";
import {
  createPromotionCoordinator,
  DEMO_PROMOTION,
  getPromotionState,
  truncateTransactionId,
  type PromotionData,
  type PromotionDiagnostic,
  type PromotionRepository,
} from "../model/promotion";

const systemClock = () => new Date();
const systemUuid = () => globalThis.crypto.randomUUID();

type PageState =
  | Readonly<{ kind: "loading" }>
  | Readonly<{ kind: "not-found" }>
  | Readonly<{ kind: "error"; message: string }>
  | Readonly<{ kind: "ready"; data: PromotionData }>;

export type PromotionPageProps = Readonly<{
  restaurantId: string;
  repository: PromotionRepository;
  clock?: () => Date;
  uuid?: () => string;
  diagnostic?: PromotionDiagnostic;
}>;

export function PromotionPage({
  restaurantId,
  repository,
  clock = systemClock,
  uuid = systemUuid,
  diagnostic,
}: PromotionPageProps) {
  const [page, setPage] = useState<PageState>({ kind: "loading" });
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const coordinator = useMemo(
    () => createPromotionCoordinator({ restaurantId, repository, clock, uuid, diagnostic }),
    [clock, diagnostic, repository, restaurantId, uuid],
  );

  const load = () => {
    setPage({ kind: "loading" });
    void repository
      .refresh(restaurantId)
      .then((data) => setPage(data ? { kind: "ready", data } : { kind: "not-found" }))
      .catch(() =>
        setPage({ kind: "error", message: "We couldn’t load this promotion." }),
      );
  };

  useEffect(load, [repository, restaurantId]);

  if (page.kind === "loading") {
    return <Skeleton aria-label="Loading promotion" style={{ height: "28rem" }} />;
  }
  if (page.kind === "not-found") return <ErrorState title="Restaurant not found." />;
  if (page.kind === "error") {
    return <ErrorState action={{ label: "Try again", onClick: load }} title={page.message} />;
  }

  const { data } = page;
  const active = getPromotionState(data.restaurant.promotedUntil, clock(), diagnostic) === "active";
  const submit = async () => {
    if (submitting || active) return;
    setSubmitting(true);
    setSubmitError(null);
    const result = await coordinator.submit(data.restaurant.promotedUntil);
    if (result.kind === "activated") {
      setPage({ kind: "ready", data: result.data });
      setConfirming(false);
    } else if (result.kind === "error") {
      setSubmitError(result.message);
    } else {
      setConfirming(false);
    }
    setSubmitting(false);
  };

  return (
    <main className="owner-insights-page owner-insights-page--promotion">
      <header>
        <p className="owner-insights-eyebrow">Demo promotion</p>
        <h1>Promote your restaurant</h1>
      </header>
      <PromotionCard active={active} onPromote={() => setConfirming(true)} restaurant={data.restaurant} />

      <section aria-labelledby="promotion-history-title" className="owner-insights-history">
        <h2 id="promotion-history-title">Promotion history</h2>
        {data.payments.length === 0 ? (
          <EmptyState title="No promotions yet." />
        ) : (
          <ul>
            {data.payments.map((payment) => (
              <li key={payment.id}>
                <div>
                  <strong>{payment.restaurantName}</strong>
                  <span><DateTime value={payment.createdAt} /></span>
                </div>
                <code title={payment.transactionId}>{truncateTransactionId(payment.transactionId)}</code>
                <span>{DEMO_PROMOTION.durationDays} days</span>
                <span>Demo promotion</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Modal
        dismissible={!submitting}
        footer={
          <>
            <Button disabled={submitting} onClick={() => setConfirming(false)} variant="secondary">
              Cancel
            </Button>
            <Button loading={submitting} onClick={() => void submit()}>
              {submitError ? "Retry promotion" : "Confirm promotion"}
            </Button>
          </>
        }
        onClose={() => {
          if (!submitting) setConfirming(false);
        }}
        open={confirming}
        title={`Promote ${data.restaurant.name}?`}
      >
        <dl className="owner-insights-confirmation">
          <div><dt>Duration</dt><dd>{DEMO_PROMOTION.durationDays} days</dd></div>
          <div><dt>Price</dt><dd>$9.99</dd></div>
          <div><dt>Payment</dt><dd>Demo payment</dd></div>
        </dl>
        <p>No real charge will be made.</p>
        {submitError ? <p role="alert">{submitError}</p> : null}
      </Modal>
    </main>
  );
}
