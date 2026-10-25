import { useI18n } from "../../../shared/i18n";
import { useAtomValue, useStore } from "jotai";
import { useEffect, useRef, useState } from "react";

import { Button, Card } from "../../../shared/ui";
import { ResendForm } from "../components/resend-form";
import { getRoleHome } from "../model/access-policy";
import { accessTokenAtom, setSessionUserAtom } from "../model/session-atoms";
import type { JotaiStore } from "../model/session-atoms";
import type { IdentityRepository } from "../model/types";

type VerifyState = "loading" | "success" | "invalid" | "network";

function isVerificationToken(value: string | null | undefined): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/i.test(value);
}

export type VerifyEmailPageProps = {
  token?: string | null;
  repository: IdentityRepository;
  navigate: (to: string) => void;
  store?: JotaiStore;
};

export function VerifyEmailPage({
  token,
  repository,
  navigate,
  store: injectedStore,
}: VerifyEmailPageProps) {
  const { t, text } = useI18n();
  const contextStore = useStore();
  const store = injectedStore ?? contextStore;
  const accessToken = useAtomValue(accessTokenAtom, { store });
  const [state, setState] = useState<VerifyState>(
    isVerificationToken(token) ? "loading" : "invalid",
  );
  const [attempt, setAttempt] = useState(0);
  const [verifiedRole, setVerifiedRole] = useState<"CUSTOMER" | "OWNER" | "COURIER" | null>(null);
  const requestKey = useRef<string | null>(null);

  useEffect(() => {
    if (!isVerificationToken(token)) {
      requestKey.current = null;
      setState("invalid");
      return;
    }
    if (requestKey.current === token) return;
    requestKey.current = token;
    setState("loading");
    void repository.verifyEmail(token).then(async (result) => {
      if (!result.ok) {
        setState(result.code === "NETWORK" ? "network" : "invalid");
        return;
      }
      if (accessToken) {
        const me = await repository.me(accessToken);
        if (me.ok) {
          store.set(setSessionUserAtom, me.value);
          setVerifiedRole(me.value.role);
        }
      }
      setState("success");
    });
  }, [accessToken, attempt, repository, store, token]);

  const retry = () => {
    requestKey.current = null;
    setState("loading");
    setAttempt((value) => value + 1);
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-warm-white px-4 py-6 [@media(max-width:639px)]:[align-items:start] [@media(max-width:639px)]:pt-8">
      <Card className="w-full max-w-[440px] border! border-solid! border-border! [@media(max-width:639px)]:[box-shadow:none]">
        {state === "loading" ? (
          <>
            <h1 className="mt-0 mb-2">{t("identity.verifying")}</h1>
            <p role="status">{t("identity.pleaseWait")}</p>
          </>
        ) : null}
        {state === "success" ? (
          <>
            <h1 className="mt-0 mb-2" tabIndex={-1}>
              {t("identity.verified")}
            </h1>
            <p>{t("identity.accountReady")}</p>
            <Button onClick={() => navigate(verifiedRole ? getRoleHome(verifiedRole) : "/login")}>
              {text(verifiedRole ? t("identity.continueApp") : t("identity.continueLogin"))}
            </Button>
          </>
        ) : null}
        {state === "invalid" ? (
          <>
            <h1 className="mt-0 mb-2" tabIndex={-1}>
              {t("identity.invalidLink")}
            </h1>
            <p>{t("identity.requestNewLink")}</p>
            <ResendForm repository={repository} />
            <Button onClick={() => navigate("/login")} variant="tertiary">
              {t("identity.backToLogin")}
            </Button>
          </>
        ) : null}
        {state === "network" ? (
          <>
            <h1 className="mt-0 mb-2" tabIndex={-1}>
              {t("identity.verifyFailed")}
            </h1>
            <p>{t("common.connectionRetry")}</p>
            <Button onClick={retry}>{t("common.tryAgain")}</Button>
          </>
        ) : null}
      </Card>
    </main>
  );
}
