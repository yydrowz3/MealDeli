import { Button, Card } from "../../../shared/ui";
import type { IdentityRepository } from "../model/types";
import { ResendForm } from "./resend-form";

export type CheckEmailProps = {
  email: string;
  repository: IdentityRepository;
  onBackToLogin?: () => void;
  onLogout?: () => void;
  gate?: boolean;
};

export function CheckEmail({
  email,
  repository,
  onBackToLogin,
  onLogout,
  gate = false,
}: CheckEmailProps) {
  return (
    <Card className="w-full max-w-[440px] border! border-solid! border-border! [@media(max-width:639px)]:[box-shadow:none]">
      <h1 className="mt-0 mb-2">{gate ? "Verify your email to continue." : "Check your email"}</h1>
      <p>{gate ? email : `We sent a verification link to ${email}. The link expires in 1 hour.`}</p>
      <ResendForm email={email} repository={repository} />
      {onBackToLogin ? (
        <Button onClick={onBackToLogin} variant="tertiary">
          Back to log in
        </Button>
      ) : null}
      {onLogout ? (
        <Button onClick={onLogout} variant="tertiary">
          Log out
        </Button>
      ) : null}
    </Card>
  );
}
