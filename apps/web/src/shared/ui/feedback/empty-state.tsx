import type { AsyncStateProps } from "./async-state";
import { AsyncStateView } from "./async-state";

export function EmptyState(props: AsyncStateProps) {
  return <AsyncStateView {...props} kind="empty" />;
}
