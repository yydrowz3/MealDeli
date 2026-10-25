import { useI18n } from "../../i18n";
import { useEffect, useId, useRef } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode, RefObject } from "react";
import { createPortal } from "react-dom";

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export type OverlayProps = {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  dismissible?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
  kind: "modal" | "drawer";
};

export function Overlay({
  open,
  title,
  description,
  children,
  footer,
  onClose,
  dismissible = true,
  initialFocusRef,
  kind,
}: OverlayProps) {
  const { text } = useI18n();
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const dismissibleRef = useRef(dismissible);
  onCloseRef.current = onClose;
  dismissibleRef.current = dismissible;

  useEffect(() => {
    if (!open) return;

    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const hadScrollLock = document.body.classList.contains("overflow-hidden!");
    document.body.classList.add("overflow-hidden!");

    const panel = panelRef.current;
    const firstFocusable = panel?.querySelector<HTMLElement>(focusableSelector);
    (initialFocusRef?.current ?? firstFocusable ?? panel)?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && dismissibleRef.current) {
        event.preventDefault();
        onCloseRef.current();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (!hadScrollLock) document.body.classList.remove("overflow-hidden!");
      trigger?.focus();
    };
  }, [initialFocusRef, open]);

  if (!open) return null;

  const trapFocus = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab") return;

    const focusable = Array.from(
      panelRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? [],
    ).filter((element) => !element.hidden && element.getAttribute("aria-hidden") !== "true");

    if (focusable.length === 0) {
      event.preventDefault();
      panelRef.current?.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-backdrop p-4"
      data-kind={kind}
      onMouseDown={(event) => {
        if (dismissible && event.target === event.currentTarget) onClose();
      }}
    >
      <div
        aria-describedby={description ? descriptionId : undefined}
        aria-labelledby={titleId}
        aria-modal="true"
        className={[
          "grid w-full max-w-auth gap-4 overflow-auto rounded-overlay bg-surface p-4 text-charcoal shadow-xl shadow-shadow md:p-6",
          kind === "drawer"
            ? "ml-auto h-full max-h-screen rounded-tr-none rounded-br-none"
            : "max-h-[calc(100dvh-2rem)]",
        ]
          .filter(Boolean)
          .join(" ")}
        onKeyDown={trapFocus}
        ref={panelRef}
        role="dialog"
        tabIndex={-1}
      >
        <header>
          <h2 className="text-section leading-heading" id={titleId}>
            {text(title)}
          </h2>
          {description ? (
            <p className="mt-2 text-muted" id={descriptionId}>
              {text(description)}
            </p>
          ) : null}
        </header>
        <div>{text(children)}</div>
        {footer ? <footer className="flex justify-end gap-3">{text(footer)}</footer> : null}
      </div>
    </div>,
    document.body,
  );
}
