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
  const contextStore = useStore();
  const store = injectedStore ?? contextStore;
  return (
    <main className="identity-page">
      <Card className="identity-card">
        <h1>Profile</h1>
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
          Log out
        </Button>
      </Card>
    </main>
  );
}
