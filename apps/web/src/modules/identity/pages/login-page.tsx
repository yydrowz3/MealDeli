import { useI18n } from "../../../shared/i18n";
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
  const { t } = useI18n();
  const contextStore = useStore();
  const store = props.store ?? contextStore;
  const user = useAtomValue(sessionUserAtom, { store });

  if (user && !user.verifiedAt) {
    return (
      <main className="flex min-h-dvh items-start justify-center px-4 py-8 sm:items-center">
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
    <main className="flex min-h-dvh items-start justify-center px-4 py-8 sm:items-center">
      <Card className="w-full max-w-auth">
        <h1 className="mb-2">{t("identity.welcomeBack")}</h1>
        <p>{t("identity.loginDescription")}</p>
        <LoginForm {...props} store={store} />
      </Card>
    </main>
  );
}
