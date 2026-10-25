import { Toaster } from "sonner";

export function ToastViewport({ theme = "light" }: { theme?: "light" | "dark" }) {
  return <Toaster closeButton position="top-right" richColors theme={theme} />;
}
