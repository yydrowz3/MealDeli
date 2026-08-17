import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import {
  AppProviders,
  PwaUpdatePrompt,
  StartupErrorPage,
  initializeMealDeliRuntime,
  parseRuntimeConfig,
} from "./app";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";
import "./index.css";

// Create a new router instance
const router = createRouter({ routeTree });

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// Render the app
const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  try {
    const runtime = initializeMealDeliRuntime(parseRuntimeConfig(import.meta.env));
    root.render(
      <StrictMode>
        <AppProviders services={runtime.services}>
          <RouterProvider router={router} />
          {import.meta.env.PROD ? <PwaUpdatePrompt /> : null}
        </AppProviders>
      </StrictMode>,
    );
  } catch {
    root.render(
      <StrictMode>
        <StartupErrorPage />
      </StrictMode>,
    );
  }
}
