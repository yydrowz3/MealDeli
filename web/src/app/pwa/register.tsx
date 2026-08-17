import { Button } from "../../shared/ui";
import { usePwaUpdatePrompt } from "./update-controller";
import type { PwaRegistrar } from "./update-controller";

export function PwaUpdatePrompt({ register }: { register?: PwaRegistrar } = {}) {
  const update = usePwaUpdatePrompt(register);
  if (!update.updateReady) return null;

  return (
    <aside aria-live="polite" className="app-update-prompt">
      <div><strong>A new version is ready.</strong><p>Reload when you’re ready to use it.</p></div>
      <Button onClick={() => void update.reload()}>Reload</Button>
      <Button onClick={update.dismiss} variant="tertiary">Later</Button>
    </aside>
  );
}
