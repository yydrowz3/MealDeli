import { useI18n } from "../../../shared/i18n";
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
  const { t, text } = useI18n();
  return (
    <Card className="w-full max-w-auth">
      <h1 className="mb-2">
        {text(gate ? t("identity.verifyToContinue") : t("identity.checkEmail"))}
      </h1>
      <p>{text(gate ? email : t("identity.verificationSent", { email: email }))}</p>
      <ResendForm email={email} repository={repository} />
      {onBackToLogin ? (
        <Button onClick={onBackToLogin} variant="tertiary">
          {t("identity.backToLogin")}
        </Button>
      ) : null}
      {onLogout ? (
        <Button onClick={onLogout} variant="tertiary">
          {t("common.logOut")}
        </Button>
      ) : null}
    </Card>
  );
}
