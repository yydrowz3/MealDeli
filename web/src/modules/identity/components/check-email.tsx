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
    <Card className="identity-card">
      <h1>{gate ? "Verify your email to continue." : "Check your email"}</h1>
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
