import type { ReactNode, RefObject } from "react";

import { Overlay } from "./overlay";

export type ModalProps = {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  dismissible?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
};

export function Modal(props: ModalProps) {
  return <Overlay {...props} kind="modal" />;
}
