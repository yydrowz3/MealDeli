import { Check } from "@phosphor-icons/react";

import { buildOrderTimeline } from "../model/status-machine";
import type { OrderStatus } from "../model/types";

export type OrderTimelineProps = Readonly<{ status: OrderStatus }>;

export function OrderTimeline({ status }: OrderTimelineProps) {
  return (
    <ol aria-label="Order progress" className="orders-timeline">
      {buildOrderTimeline(status).map((step) => (
        <li
          aria-current={step.state === "current" ? "step" : undefined}
          className={`orders-timeline__step orders-timeline__step--${step.state}`}
          data-status={step.status}
          key={step.status}
        >
          <span aria-hidden="true" className="orders-timeline__marker">
            {step.state === "complete" ? <Check weight="bold" /> : null}
          </span>
          <span>
            <strong>{step.label}</strong>
            <small>{step.description}</small>
          </span>
        </li>
      ))}
    </ol>
  );
}
