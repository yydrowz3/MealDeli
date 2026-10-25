import { toast } from "sonner";
import { resolveMessage } from "../../i18n";

export type ToastOptions = {
  action?: { label: string; onClick: () => void };
};

function toSonnerOptions(options?: ToastOptions) {
  return options?.action
    ? { action: { label: resolveMessage(options.action.label), onClick: options.action.onClick } }
    : undefined;
}

export const toastAdapter = {
  success(message: string, options?: ToastOptions) {
    return toast.success(resolveMessage(message), toSonnerOptions(options));
  },
  error(message: string, options?: ToastOptions) {
    return toast.error(resolveMessage(message), toSonnerOptions(options));
  },
  info(message: string, options?: ToastOptions) {
    return toast.info(resolveMessage(message), toSonnerOptions(options));
  },
};
