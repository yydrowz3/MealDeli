import type { ReactNode, RefObject } from "react";

import { Overlay } from "./overlay";

export type DrawerProps = {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  dismissible?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
};

export function Drawer(props: DrawerProps) {
  return <Overlay {...props} kind="drawer" />;
}
