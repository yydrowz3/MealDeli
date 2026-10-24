import type { ApolloClient } from "@apollo/client";
import { z } from "zod";

import { useFragment as readFragment } from "../../../gql";
import {
  IdentityEditProfileDocument,
  IdentityMeDocument,
  IdentityRefreshAccessTokenDocument,
  IdentityResendVerificationDocument,
  IdentitySessionUserFragmentDoc,
  IdentitySignInDocument,
  IdentitySignOutDocument,
  IdentitySignUpDocument,
  IdentityVerifyEmailDocument,
} from "../../../gql/graphql";
import type {
  CommandResult,
  IdentityErrorCode,
  IdentityRepository,
  ProfileCommand,
  SessionUser,
  SignUpCommand,
} from "../model/types";

export type IdentityGraphqlClient = Pick<ApolloClient, "mutate" | "query">;

const sessionUserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(["CUSTOMER", "OWNER", "COURIER"]),
  verifiedAt: z.unknown().transform((value) => (typeof value === "string" ? value : null)),
  address: z.string().nullable(),
  image: z.string().nullable(),
});

type CoreOutput = { ok: boolean; error?: string | null };

function authorization(accessToken: string | null) {
  return accessToken ? { headers: { authorization: `Bearer ${accessToken}` } } : undefined;
}

function mapCode(message: string | null | undefined): IdentityErrorCode {
  const text = message?.toLowerCase() ?? "";
  if (/(incorrect|user not found|login failed)/.test(text)) return "INVALID_CREDENTIALS";
  if (/(already exists|duplicate)/.test(text)) return "DUPLICATE_EMAIL";
  if (/(verification|token has expired|verfication)/.test(text)) return "INVALID_VERIFICATION";
  if (/(unauthorized|session|refresh token)/.test(text)) return "UNAUTHORIZED";
  return "UNKNOWN";
}

function command(output: CoreOutput): CommandResult {
  if (output.ok) return { ok: true, value: undefined };
  return {
    ok: false,
    code: mapCode(output.error),
    message: output.error || "The request failed.",
  };
}

function networkResult(error: unknown): CommandResult<never> {
  return {
    ok: false,
    code: "NETWORK",
    message: error instanceof Error ? error.message : "The network request failed.",
  };
}

export function createIdentityRepository(client: IdentityGraphqlClient): IdentityRepository {
  return {
    async refreshAccessToken() {
      try {
        const response = await client.mutate({ mutation: IdentityRefreshAccessTokenDocument });
        const output = response.data?.refreshAccessToken;
        if (!output?.ok || !output.accessToken) {
          return {
            ok: false,
            code: mapCode(output?.error),
            message: output?.error || "No active session.",
          };
        }
        return { ok: true, value: output.accessToken };
      } catch (error) {
        return networkResult(error);
      }
    },

    async me(accessToken) {
      try {
        const response = await client.query({
          query: IdentityMeDocument,
          fetchPolicy: "network-only",
          context: authorization(accessToken),
        });
        if (!response.data) return networkResult(new Error("The profile returned no data."));
        const value = readFragment(IdentitySessionUserFragmentDoc, response.data.me);
        const parsed = sessionUserSchema.safeParse(value);
        if (!parsed.success) {
          return { ok: false, code: "UNKNOWN", message: "The profile response was invalid." };
        }
        return { ok: true, value: parsed.data };
      } catch (error) {
        return networkResult(error);
      }
    },

    async signIn(input) {
      try {
        const response = await client.mutate({
          mutation: IdentitySignInDocument,
          variables: { input },
        });
        const output = response.data?.signIn;
        if (!output?.ok || !output.accessToken) {
          return {
            ok: false,
            code: mapCode(output?.error),
            message: output?.error || "Login failed.",
          };
        }
        return { ok: true, value: output.accessToken };
      } catch (error) {
        return networkResult(error);
      }
    },

    async signUp(input: SignUpCommand) {
      try {
        const response = await client.mutate({
          mutation: IdentitySignUpDocument,
          variables: { input },
        });
        return response.data?.signUp
          ? command(response.data.signUp)
          : networkResult(new Error("The registration returned no data."));
      } catch (error) {
        return networkResult(error);
      }
    },

    async signOut(accessToken) {
      try {
        const response = await client.mutate({
          mutation: IdentitySignOutDocument,
          context: authorization(accessToken),
        });
        return response.data?.signOut
          ? command(response.data.signOut)
          : networkResult(new Error("The logout returned no data."));
      } catch (error) {
        return networkResult(error);
      }
    },

    async verifyEmail(token) {
      try {
        const response = await client.mutate({
          mutation: IdentityVerifyEmailDocument,
          variables: { input: { token } },
        });
        return response.data?.verifyEmail
          ? command(response.data.verifyEmail)
          : networkResult(new Error("Verification returned no data."));
      } catch (error) {
        return networkResult(error);
      }
    },

    async resendVerification(email) {
      try {
        const response = await client.mutate({
          mutation: IdentityResendVerificationDocument,
          variables: { input: { email } },
        });
        return response.data?.resendVerification
          ? command(response.data.resendVerification)
          : networkResult(new Error("Resend returned no data."));
      } catch (error) {
        return networkResult(error);
      }
    },

    async editProfile(accessToken: string, input: ProfileCommand) {
      try {
        const response = await client.mutate({
          mutation: IdentityEditProfileDocument,
          variables: { input },
          context: authorization(accessToken),
        });
        return response.data?.editProfile
          ? command(response.data.editProfile)
          : networkResult(new Error("The profile update returned no data."));
      } catch (error) {
        return networkResult(error);
      }
    },
  };
}

export function adaptIdentitySessionUser(value: unknown): SessionUser {
  return sessionUserSchema.parse(value);
}
