import { useEffect, useState } from "react";

export type PwaRegistrationController = {
  activateWaiting: () => Promise<void>;
};

export type PwaRegistrar = (onNeedRefresh: () => void) => Promise<PwaRegistrationController>;

export const registerPwa: PwaRegistrar = async (onNeedRefresh) => {
  if (!("serviceWorker" in navigator)) {
    return { activateWaiting: () => Promise.resolve() };
  }

  const registration = await navigator.serviceWorker.register("/sw.js");
  const notifyIfWaiting = () => {
    if (registration.waiting) onNeedRefresh();
  };
  notifyIfWaiting();
  registration.addEventListener("updatefound", () => {
    const installing = registration.installing;
    installing?.addEventListener("statechange", () => {
      if (installing.state === "installed" && navigator.serviceWorker.controller) {
        onNeedRefresh();
      }
    });
  });

  return {
    activateWaiting: async () => {
      const waiting = registration.waiting;
      if (!waiting) return;
      await new Promise<void>((resolve) => {
        navigator.serviceWorker.addEventListener(
          "controllerchange",
          () => {
            window.location.reload();
            resolve();
          },
          { once: true },
        );
        waiting.postMessage({ type: "SKIP_WAITING" });
      });
    },
  };
};

export function usePwaUpdatePrompt(register: PwaRegistrar = registerPwa) {
  const [updateReady, setUpdateReady] = useState(false);
  const [controller, setController] = useState<PwaRegistrationController | null>(null);

  useEffect(() => {
    let active = true;
    void register(() => {
      if (active) setUpdateReady(true);
    }).then((nextController) => {
      if (active) setController(nextController);
    });
    return () => {
      active = false;
    };
  }, [register]);

  return {
    updateReady,
    reload: () => controller?.activateWaiting() ?? Promise.resolve(),
    dismiss: () => setUpdateReady(false),
  };
}
