import { errorMessage, message as localizedMessage, useI18n } from "../../../shared/i18n";
import { useEffect, useMemo, useState } from "react";

import {
  Button,
  DateTime,
  EmptyState,
  ErrorState,
  Modal,
  Money,
  Skeleton,
} from "../../../shared/ui";
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
  const { t, text } = useI18n();
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
      .catch(() => setPage({ kind: "error", message: localizedMessage("insights.loadFailed") }));
  };

  useEffect(load, [repository, restaurantId]);

  if (page.kind === "loading") {
    return <Skeleton aria-label={t("insights.loading")} className="h-112" />;
  }
  if (page.kind === "not-found") return <ErrorState title={t("common.restaurantNotFound")} />;
  if (page.kind === "error") {
    return (
      <ErrorState
        action={{ label: t("common.tryAgain"), onClick: load }}
        title={text(page.message)}
      />
    );
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
      setSubmitError(errorMessage(result.message, "insights.activateFailed"));
    } else {
      setConfirming(false);
    }
    setSubmitting(false);
  };

  return (
    <main className="grid gap-6 mx-auto max-w-4xl p-4 md:p-6">
      <header>
        <p className="mb-2 text-jade-text text-small font-bold uppercase">
          {t("insights.demoPromotion")}
        </p>
        <h1>{t("insights.promoteRestaurant")}</h1>
      </header>
      <PromotionCard
        active={active}
        onPromote={() => setConfirming(true)}
        restaurant={data.restaurant}
      />

      <section aria-labelledby="promotion-history-title">
        <h2 id="promotion-history-title">{t("insights.history")}</h2>
        {data.payments.length === 0 ? (
          <EmptyState title={t("insights.emptyPromotions")} />
        ) : (
          <ul className="grid gap-3 list-none p-0">
            {data.payments.map((payment) => (
              <li
                className="grid gap-3 rounded-card border border-border bg-surface p-4 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto] lg:items-center"
                key={payment.id}
              >
                <div className="grid">
                  <strong>{text(payment.restaurantName)}</strong>
                  <span>
                    <DateTime value={payment.createdAt} />
                  </span>
                </div>
                <code title={text(payment.transactionId)}>
                  {text(truncateTransactionId(payment.transactionId))}
                </code>
                <span>{t("insights.durationDays", { count: DEMO_PROMOTION.durationDays })}</span>
                <span>{t("insights.demoPromotion")}</span>
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
              {t("common.cancel")}
            </Button>
            <Button loading={submitting} onClick={() => void submit()}>
              {text(submitError ? t("insights.retry") : t("insights.confirm"))}
            </Button>
          </>
        }
        onClose={() => {
          if (!submitting) setConfirming(false);
        }}
        open={confirming}
        title={t("insights.confirmName", { name: data.restaurant.name })}
      >
        <dl className="[&_div]:flex [&_div]:justify-between">
          <div>
            <dt>{t("insights.duration")}</dt>
            <dd>{t("insights.durationDays", { count: DEMO_PROMOTION.durationDays })}</dd>
          </div>
          <div>
            <dt>{t("insights.price")}</dt>
            <dd>
              <Money minor={DEMO_PROMOTION.priceMinor} />
            </dd>
          </div>
          <div>
            <dt>{t("common.payment")}</dt>
            <dd>{t("common.demoPayment")}</dd>
          </div>
        </dl>
        <p>{t("insights.noCharge")}</p>
        {submitError ? <p role="alert">{text(submitError)}</p> : null}
      </Modal>
    </main>
  );
}
