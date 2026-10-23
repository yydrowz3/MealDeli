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
  CUSTOMER: "Create your customer account",
  OWNER: "Create your owner account",
  COURIER: "Create your courier account",
};

export function SignupPage({ repository, role, navigate }: SignupPageProps) {
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  if (registeredEmail) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-warm-white px-4 py-6 [@media(max-width:639px)]:[align-items:start] [@media(max-width:639px)]:pt-8">
        <CheckEmail
          email={registeredEmail}
          onBackToLogin={() => navigate("/login")}
          repository={repository}
        />
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-warm-white px-4 py-6 [@media(max-width:639px)]:[align-items:start] [@media(max-width:639px)]:pt-8">
      <Card className="w-full max-w-[440px] border! border-solid! border-border! [@media(max-width:639px)]:[box-shadow:none]">
        <h1 className="mt-0 mb-2">{role ? titles[role] : "Choose how you want to use MealDeli"}</h1>
        <SignupForm onSuccess={setRegisteredEmail} repository={repository} role={role} />
        {role ? (
          <Button onClick={() => navigate("/#roles")} variant="tertiary">
            Choose a different role
          </Button>
        ) : null}
      </Card>
    </main>
  );
}
