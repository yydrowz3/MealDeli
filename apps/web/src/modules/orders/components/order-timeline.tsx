import { Check } from "@phosphor-icons/react";

import { buildOrderTimeline, type OrderTimelineStep } from "../model/status-machine";
import type { OrderStatus } from "../model/types";

export type OrderTimelineProps = Readonly<{ status: OrderStatus }>;

const stepClasses = {
  complete: "text-charcoal",
  current: "text-charcoal",
  upcoming: "text-muted",
} satisfies Record<OrderTimelineStep["state"], string>;

const markerClasses = {
  complete: "border-jade bg-jade",
  current: "border-jade bg-jade [box-shadow:inset_0_0_0_0.3rem_var(--color-surface)]",
  upcoming: "border-border",
} satisfies Record<OrderTimelineStep["state"], string>;

export function OrderTimeline({ status }: OrderTimelineProps) {
  return (
    <ol
      aria-label="Order progress"
      className="m-0 grid list-none gap-4 p-0 md:grid-cols-[repeat(5,1fr)]"
    >
      {buildOrderTimeline(status).map((step) => (
        <li
          aria-current={step.state === "current" ? "step" : undefined}
          className={`grid grid-cols-[1.75rem_1fr] [align-items:start] gap-3 md:grid-cols-[1fr] ${stepClasses[step.state]}`}
          data-status={step.status}
          key={step.status}
        >
          <span
            aria-hidden="true"
            className={`inline-flex h-6 w-6 items-center justify-center rounded-[50%] border-2 border-solid ${markerClasses[step.state]}`}
          >
            {step.state === "complete" ? <Check weight="bold" /> : null}
          </span>
          <span>
            <strong className="block">{step.label}</strong>
            <small className="block">{step.description}</small>
          </span>
        </li>
      ))}
    </ol>
  );
}
