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
      <main className="flex min-h-dvh items-center justify-center bg-warm-white px-4 py-6 [@media(max-width:639px)]:[align-items:start] [@media(max-width:639px)]:pt-8">
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
    <main className="flex min-h-dvh items-center justify-center bg-warm-white px-4 py-6 [@media(max-width:639px)]:[align-items:start] [@media(max-width:639px)]:pt-8">
      <Card className="w-full max-w-[440px] border! border-solid! border-border! [@media(max-width:639px)]:[box-shadow:none]">
        <h1 className="mt-0 mb-2">Welcome back</h1>
        <p>Log in to continue to MealDeli.</p>
        <LoginForm {...props} store={store} />
      </Card>
    </main>
  );
}
