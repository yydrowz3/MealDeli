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
    <main className="identity-page">
      <Card className="identity-card">
        {state === "loading" ? (
          <>
            <h1>Verifying your email…</h1>
            <p role="status">Please wait.</p>
          </>
        ) : null}
        {state === "success" ? (
          <>
            <h1 tabIndex={-1}>Email verified</h1>
            <p>Your MealDeli account is ready.</p>
            <Button onClick={() => navigate(verifiedRole ? getRoleHome(verifiedRole) : "/login")}>
              {verifiedRole ? "Continue to MealDeli" : "Continue to log in"}
            </Button>
          </>
        ) : null}
        {state === "invalid" ? (
          <>
            <h1 tabIndex={-1}>This verification link is no longer valid</h1>
            <p>Request a new email to verify your account.</p>
            <ResendForm repository={repository} />
            <Button onClick={() => navigate("/login")} variant="tertiary">
              Back to log in
            </Button>
          </>
        ) : null}
        {state === "network" ? (
          <>
            <h1 tabIndex={-1}>We couldn’t verify your email</h1>
            <p>Check your connection and try again.</p>
            <Button onClick={retry}>Try again</Button>
          </>
        ) : null}
      </Card>
    </main>
  );
}
