import { render } from "@testing-library/react";
import type { ReactElement } from "react";

export function renderUi(ui: ReactElement) {
  return render(ui);
}
