import { describe, expect, it, vi } from "vitest";

import type { IdentityGraphqlClient } from "./identity-repository";
import { adaptIdentitySessionUser, createIdentityRepository } from "./identity-repository";

describe("identity repository", () => {
  it("maps credential failures without exposing backend account details", async () => {
    const client = {
      mutate: vi.fn().mockResolvedValue({
        data: {
          signIn: {
            __typename: "SignInOutput",
            ok: false,
            error: "User not found",
            accessToken: null,
          },
        },
      }),
      query: vi.fn(),
    } as unknown as IdentityGraphqlClient;

    await expect(
      createIdentityRepository(client).signIn({
        email: "unknown@example.test",
        password: "password",
      }),
    ).resolves.toMatchObject({ ok: false, code: "INVALID_CREDENTIALS" });
  });

  it("adapts the generated IdentityMe document into the domain user", async () => {
    const query = vi.fn().mockResolvedValue({
      data: {
        me: {
          __typename: "User",
          id: "user-1",
          email: "alex@example.test",
          name: "Alex",
          role: "OWNER",
          verifiedAt: "2026-08-17T00:00:00.000Z",
          address: null,
          image: null,
        },
      },
    });
    const client = { mutate: vi.fn(), query } as unknown as IdentityGraphqlClient;

    await expect(createIdentityRepository(client).me("access-token")).resolves.toEqual({
      ok: true,
      value: {
        id: "user-1",
        email: "alex@example.test",
        name: "Alex",
        role: "OWNER",
        verifiedAt: "2026-08-17T00:00:00.000Z",
        address: null,
        image: null,
      },
    });
    expect(query).toHaveBeenCalledWith(
      expect.objectContaining({
        fetchPolicy: "network-only",
        context: { headers: { authorization: "Bearer access-token" } },
      }),
    );
  });

  it("normalizes transport exceptions to a network result", async () => {
    const client = {
      mutate: vi.fn().mockRejectedValue(new Error("offline")),
      query: vi.fn(),
    } as unknown as IdentityGraphqlClient;
    await expect(
      createIdentityRepository(client).resendVerification("unknown@example.test"),
    ).resolves.toMatchObject({ ok: false, code: "NETWORK" });
  });

  it("covers refresh and sign-in success, missing data, and session error mapping", async () => {
    const mutate = vi
      .fn()
      .mockResolvedValueOnce({ data: { refreshAccessToken: { ok: true, accessToken: "fresh" } } })
      .mockResolvedValueOnce({ data: { refreshAccessToken: { ok: false, error: "Refresh token expired" } } })
      .mockResolvedValueOnce({ data: undefined })
      .mockResolvedValueOnce({ data: { signIn: { ok: true, accessToken: "signed-in" } } })
      .mockResolvedValueOnce({ data: undefined });
    const repository = createIdentityRepository({ mutate, query: vi.fn() } as unknown as IdentityGraphqlClient);

    await expect(repository.refreshAccessToken()).resolves.toEqual({ ok: true, value: "fresh" });
    await expect(repository.refreshAccessToken()).resolves.toMatchObject({ ok: false, code: "UNAUTHORIZED" });
    await expect(repository.refreshAccessToken()).resolves.toMatchObject({ ok: false, code: "UNKNOWN" });
    await expect(repository.signIn({ email: "a@b.test", password: "password" })).resolves.toEqual({
      ok: true,
      value: "signed-in",
    });
    await expect(repository.signIn({ email: "a@b.test", password: "password" })).resolves.toMatchObject({
      ok: false,
      code: "UNKNOWN",
    });
  });

  it("maps every command mutation and authorization context", async () => {
    const mutate = vi
      .fn()
      .mockResolvedValueOnce({ data: { signUp: { ok: true } } })
      .mockResolvedValueOnce({ data: { signOut: { ok: true } } })
      .mockResolvedValueOnce({ data: { verifyEmail: { ok: false, error: "Token has expired" } } })
      .mockResolvedValueOnce({ data: { resendVerification: { ok: true } } })
      .mockResolvedValueOnce({ data: { editProfile: { ok: false, error: "Unauthorized" } } });
    const repository = createIdentityRepository({ mutate, query: vi.fn() } as unknown as IdentityGraphqlClient);
    await expect(
      repository.signUp({ name: "A", email: "a@b.test", password: "password", role: "CUSTOMER" }),
    ).resolves.toEqual({ ok: true, value: undefined });
    await expect(repository.signOut(null)).resolves.toEqual({ ok: true, value: undefined });
    await expect(repository.verifyEmail("token")).resolves.toMatchObject({
      ok: false,
      code: "INVALID_VERIFICATION",
    });
    await expect(repository.resendVerification("a@b.test")).resolves.toEqual({
      ok: true,
      value: undefined,
    });
    await expect(
      repository.editProfile("access", { name: "A", address: null, image: null }),
    ).resolves.toMatchObject({ ok: false, code: "UNAUTHORIZED" });
    expect(mutate).toHaveBeenLastCalledWith(
      expect.objectContaining({ context: { headers: { authorization: "Bearer access" } } }),
    );
  });

  it("returns network-shaped failures when command payloads are absent", async () => {
    const methods = [
      (repository: ReturnType<typeof createIdentityRepository>) =>
        repository.signUp({ name: "A", email: "a@b.test", password: "password", role: "OWNER" }),
      (repository: ReturnType<typeof createIdentityRepository>) => repository.signOut("access"),
      (repository: ReturnType<typeof createIdentityRepository>) => repository.verifyEmail("token"),
      (repository: ReturnType<typeof createIdentityRepository>) =>
        repository.resendVerification("a@b.test"),
      (repository: ReturnType<typeof createIdentityRepository>) =>
        repository.editProfile("access", { name: "A", address: null, image: null }),
    ];
    for (const run of methods) {
      const repository = createIdentityRepository({
        mutate: vi.fn().mockResolvedValue({ data: undefined }),
        query: vi.fn(),
      } as unknown as IdentityGraphqlClient);
      await expect(run(repository)).resolves.toMatchObject({ ok: false, code: "NETWORK" });
    }
  });

  it("rejects missing or invalid profile data and parses stable users", async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce({ data: undefined })
      .mockResolvedValueOnce({ data: { me: { id: "", email: "bad" } } })
      .mockRejectedValueOnce("offline");
    const repository = createIdentityRepository({ mutate: vi.fn(), query } as unknown as IdentityGraphqlClient);
    await expect(repository.me("access")).resolves.toMatchObject({ ok: false, code: "NETWORK" });
    await expect(repository.me("access")).resolves.toMatchObject({ ok: false, code: "UNKNOWN" });
    await expect(repository.me("access")).resolves.toMatchObject({ ok: false, code: "NETWORK" });

    expect(
      adaptIdentitySessionUser({
        id: "user-1",
        email: "a@b.test",
        name: "A",
        role: "COURIER",
        verifiedAt: 123,
        address: null,
        image: null,
      }),
    ).toMatchObject({ role: "COURIER", verifiedAt: null });
    expect(() => adaptIdentitySessionUser({ id: "invalid" })).toThrow();
  });
});
