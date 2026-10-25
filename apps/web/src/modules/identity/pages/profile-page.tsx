import { useI18n } from "../../../shared/i18n";
import { useStore } from "jotai";

import type { MediaUploader } from "../../media";
import { Button, Card } from "../../../shared/ui";
import { ProfileForm } from "../components/profile-form";
import { logoutLocallyFirst } from "../model/logout";
import type { JotaiStore } from "../model/session-atoms";
import type { IdentityRepository } from "../model/types";

export type ProfilePageProps = {
  repository: IdentityRepository;
  uploader?: MediaUploader;
  navigate: (to: string) => void;
  store?: JotaiStore;
};

export function ProfilePage({
  repository,
  uploader,
  navigate,
  store: injectedStore,
}: ProfilePageProps) {
  const { t } = useI18n();
  const contextStore = useStore();
  const store = injectedStore ?? contextStore;
  return (
    <main className="flex min-h-dvh items-center justify-center bg-warm-white px-4 py-6 [@media(max-width:639px)]:[align-items:start] [@media(max-width:639px)]:pt-8">
      <Card className="w-full max-w-[440px] border! border-solid! border-border! [@media(max-width:639px)]:[box-shadow:none]">
        <h1 className="mt-0 mb-2">{t("common.profile")}</h1>
        <ProfileForm
          onVerificationRequired={() => navigate("/login")}
          repository={repository}
          store={store}
          uploader={uploader}
        />
        <Button
          onClick={() => {
            void logoutLocallyFirst(store, repository);
            navigate("/login");
          }}
          variant="tertiary"
        >
          {t("common.logOut")}
        </Button>
      </Card>
    </main>
  );
}
