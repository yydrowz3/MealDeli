import { message as localizedMessage, useI18n } from "../../../shared/i18n";
import { useState } from "react";

import { Button, Card } from "../../../shared/ui";
import { CheckEmail } from "../components/check-email";
import { SignupForm } from "../components/signup-form";
import type { IdentityRepository, UserRole } from "../model/types";

export type SignupPageProps = {
  repository: IdentityRepository;
  role: UserRole | null;
  navigate: (to: string) => void;
};

const titles: Record<UserRole, string> = {
  CUSTOMER: localizedMessage("identity.customerAccount"),
  OWNER: localizedMessage("identity.ownerAccount"),
  COURIER: localizedMessage("identity.courierAccount"),
};

export function SignupPage({ repository, role, navigate }: SignupPageProps) {
  const { t, text } = useI18n();
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  if (registeredEmail) {
    return (
      <main className="flex min-h-dvh items-start justify-center px-4 py-8 sm:items-center">
        <CheckEmail
          email={registeredEmail}
          onBackToLogin={() => navigate("/login")}
          repository={repository}
        />
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh items-start justify-center px-4 py-8 sm:items-center">
      <Card className="w-full max-w-auth">
        <h1 className="mb-2">{text(role ? titles[role] : t("identity.chooseUsage"))}</h1>
        <SignupForm onSuccess={setRegisteredEmail} repository={repository} role={role} />
        {role ? (
          <Button onClick={() => navigate("/#roles")} variant="tertiary">
            {t("identity.changeRole")}
          </Button>
        ) : null}
      </Card>
    </main>
  );
}
