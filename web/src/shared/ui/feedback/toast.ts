import { toast } from "sonner";

export type ToastOptions = {
  action?: { label: string; onClick: () => void };
};

function toSonnerOptions(options?: ToastOptions) {
  return options?.action
    ? { action: { label: options.action.label, onClick: options.action.onClick } }
    : undefined;
}

export const toastAdapter = {
  success(message: string, options?: ToastOptions) {
    return toast.success(message, toSonnerOptions(options));
  },
  error(message: string, options?: ToastOptions) {
    return toast.error(message, toSonnerOptions(options));
  },
  info(message: string, options?: ToastOptions) {
    return toast.info(message, toSonnerOptions(options));
  },
};
