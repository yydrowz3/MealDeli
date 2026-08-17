import { z } from "zod";

const httpUrl = z.url().refine((value) => {
  const protocol = new URL(value).protocol;
  return protocol === "http:" || protocol === "https:";
}, "Must use http or https.");

const wsUrl = z.url().refine((value) => {
  const protocol = new URL(value).protocol;
  return protocol === "ws:" || protocol === "wss:";
}, "Must use ws or wss.");

const origin = z.string().superRefine((value, context) => {
  try {
    const url = new URL(value);
    if (
      (url.protocol !== "http:" && url.protocol !== "https:") ||
      url.origin !== value.replace(/\/$/, "")
    ) {
      context.addIssue({ code: "custom", message: "Must be an absolute http(s) origin." });
    }
  } catch {
    context.addIssue({ code: "custom", message: "Must be an absolute http(s) origin." });
  }
});

const runtimeConfigSchema = z.object({
  VITE_API_HTTP_URL: httpUrl,
  VITE_API_WS_URL: wsUrl,
  VITE_APP_ORIGIN: origin,
});

export type RuntimeConfig = {
  apiHttpUrl: string;
  apiWsUrl: string;
  appOrigin: string;
};

export class RuntimeConfigError extends Error {
  constructor() {
    super("MealDeli isn’t configured correctly.");
    this.name = "RuntimeConfigError";
  }
}

export function parseRuntimeConfig(environment: Record<string, unknown>): RuntimeConfig {
  const result = runtimeConfigSchema.safeParse(environment);
  if (!result.success) {
    throw new RuntimeConfigError();
  }

  return {
    apiHttpUrl: result.data.VITE_API_HTTP_URL,
    apiWsUrl: result.data.VITE_API_WS_URL,
    appOrigin: result.data.VITE_APP_ORIGIN.replace(/\/$/, ""),
  };
}
