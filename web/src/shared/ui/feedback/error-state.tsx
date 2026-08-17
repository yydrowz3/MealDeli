import type { AsyncStateProps } from "./async-state";
import { AsyncStateView } from "./async-state";

export function ErrorState(props: AsyncStateProps) {
  return <AsyncStateView {...props} kind="error" />;
}
