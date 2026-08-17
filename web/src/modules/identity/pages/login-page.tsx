import { useAtomValue, useStore } from "jotai";

import { Card } from "../../../shared/ui";
import { CheckEmail } from "../components/check-email";
import { LoginForm } from "../components/login-form";
import { logoutLocallyFirst } from "../model/logout";
import { sessionUserAtom } from "../model/session-atoms";
import type { JotaiStore } from "../model/session-atoms";
import type { IdentityRepository } from "../model/types";

export type LoginPageProps = {
  repository: IdentityRepository;
  navigate: (to: string) => void;
  returnTo?: string | null;
  store?: JotaiStore;
};

export function LoginPage(props: LoginPageProps) {
  const contextStore = useStore();
  const store = props.store ?? contextStore;
  const user = useAtomValue(sessionUserAtom, { store });

  if (user && !user.verifiedAt) {
    return (
      <main className="identity-page">
        <CheckEmail
          email={user.email}
          gate
          onLogout={() => void logoutLocallyFirst(store, props.repository)}
          repository={props.repository}
        />
      </main>
    );
  }

  return (
    <main className="identity-page">
      <Card className="identity-card">
        <h1>Welcome back</h1>
        <p>Log in to continue to MealDeli.</p>
        <LoginForm {...props} store={store} />
      </Card>
    </main>
  );
}
