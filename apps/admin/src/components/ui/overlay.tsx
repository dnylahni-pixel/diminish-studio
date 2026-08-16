import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import * as HoverCardPrimitive from "@radix-ui/react-hover-card";
import { X } from "lucide-react";
import { cn } from "../../utils/cn";
import { Button } from "./actions";

/* ---------------------------------------------------------------------
   Modal / Dialog
   --------------------------------------------------------------------- */
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;

/** Modal is a semantic alias of Dialog — same primitive, different naming convention. */
export const Modal = DialogPrimitive.Root;
export const ModalTrigger = DialogPrimitive.Trigger;

export function DialogContent({
  title,
  description,
  children,
  footer,
  size = "md",
  className,
}: {
  title?: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-xl" };
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-[var(--z-modal)] bg-neutral-900/[var(--opacity-backdrop)] animate-[var(--animate-fade-in)]" />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-[var(--z-modal)] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-xl)] border border-neutral-200 bg-neutral-0 p-6 shadow-[var(--shadow-xl)] outline-none animate-[var(--animate-scale-in)]",
          sizes[size],
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            {title && <DialogPrimitive.Title className="text-lg font-semibold text-neutral-900">{title}</DialogPrimitive.Title>}
            {description && <DialogPrimitive.Description className="mt-1 text-sm text-neutral-500">{description}</DialogPrimitive.Description>}
          </div>
          <DialogPrimitive.Close className="rounded-[var(--radius-sm)] p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700" aria-label="Close">
            <X className="size-4" />
          </DialogPrimitive.Close>
        </div>
        {children && <div className="mt-4">{children}</div>}
        {footer && <div className="mt-6 flex justify-end gap-2.5">{footer}</div>}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

/** ModalContent is a semantic alias of DialogContent. */
export const ModalContent = DialogContent;

/* ---------------------------------------------------------------------
   Alert Dialog
   --------------------------------------------------------------------- */
export const AlertDialog = AlertDialogPrimitive.Root;
export const AlertDialogTrigger = AlertDialogPrimitive.Trigger;

export function AlertDialogContent({
  title,
  description,
  cancelLabel = "Cancel",
  confirmLabel = "Confirm",
  onConfirm,
  tone = "primary",
}: {
  title: string;
  description?: string;
  cancelLabel?: string;
  confirmLabel?: string;
  onConfirm?: () => void;
  tone?: "primary" | "danger";
}) {
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Overlay className="fixed inset-0 z-[var(--z-modal)] bg-neutral-900/[var(--opacity-backdrop)] animate-[var(--animate-fade-in)]" />
      <AlertDialogPrimitive.Content className="fixed left-1/2 top-1/2 z-[var(--z-modal)] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-xl)] border border-neutral-200 bg-neutral-0 p-6 shadow-[var(--shadow-xl)] outline-none animate-[var(--animate-scale-in)]">
        <AlertDialogPrimitive.Title className="text-lg font-semibold text-neutral-900">{title}</AlertDialogPrimitive.Title>
        {description && <AlertDialogPrimitive.Description className="mt-1.5 text-sm text-neutral-500">{description}</AlertDialogPrimitive.Description>}
        <div className="mt-6 flex justify-end gap-2.5">
          <AlertDialogPrimitive.Cancel asChild>
            <Button variant="secondary">{cancelLabel}</Button>
          </AlertDialogPrimitive.Cancel>
          <AlertDialogPrimitive.Action asChild>
            <Button variant={tone === "danger" ? "danger" : "primary"} onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </AlertDialogPrimitive.Action>
        </div>
      </AlertDialogPrimitive.Content>
    </AlertDialogPrimitive.Portal>
  );
}

/* ---------------------------------------------------------------------
   Drawer (side panel)
   --------------------------------------------------------------------- */
export function Drawer({
  open,
  onOpenChange,
  side = "right",
  title,
  description,
  children,
  footer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side?: "left" | "right";
  title?: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[var(--z-drawer)] bg-neutral-900/[var(--opacity-backdrop)] animate-[var(--animate-fade-in)]" />
        <DialogPrimitive.Content
          className={cn(
            "fixed top-0 z-[var(--z-drawer)] h-full w-full max-w-sm flex flex-col bg-neutral-0 shadow-[var(--shadow-xl)] outline-none",
            side === "right" ? "right-0 animate-[var(--animate-slide-up)]" : "left-0 animate-[var(--animate-slide-up)]",
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-neutral-100 p-5">
            <div>
              {title && <DialogPrimitive.Title className="text-base font-semibold text-neutral-900">{title}</DialogPrimitive.Title>}
              {description && <DialogPrimitive.Description className="mt-1 text-sm text-neutral-500">{description}</DialogPrimitive.Description>}
            </div>
            <DialogPrimitive.Close className="rounded-[var(--radius-sm)] p-1 text-neutral-400 hover:bg-neutral-100" aria-label="Close">
              <X className="size-4" />
            </DialogPrimitive.Close>
          </div>
          <div className="flex-1 overflow-y-auto p-5">{children}</div>
          {footer && <div className="border-t border-neutral-100 p-5 flex justify-end gap-2.5">{footer}</div>}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/* ---------------------------------------------------------------------
   Bottom sheet
   --------------------------------------------------------------------- */
export function BottomSheet({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children?: React.ReactNode;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[var(--z-drawer)] bg-neutral-900/[var(--opacity-backdrop)] animate-[var(--animate-fade-in)]" />
        <DialogPrimitive.Content className="fixed bottom-0 left-0 right-0 z-[var(--z-drawer)] max-h-[85vh] rounded-t-[var(--radius-2xl)] bg-neutral-0 p-5 shadow-[var(--shadow-xl)] outline-none animate-[var(--animate-slide-up)]">
          <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-neutral-200" />
          {title && <DialogPrimitive.Title className="text-base font-semibold text-neutral-900">{title}</DialogPrimitive.Title>}
          <div className="mt-3 overflow-y-auto">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/* ---------------------------------------------------------------------
   Hover card
   --------------------------------------------------------------------- */
export function HoverCard({ trigger, children }: { trigger: React.ReactNode; children: React.ReactNode }) {
  return (
    <HoverCardPrimitive.Root openDelay={150}>
      <HoverCardPrimitive.Trigger asChild>{trigger}</HoverCardPrimitive.Trigger>
      <HoverCardPrimitive.Portal>
        <HoverCardPrimitive.Content
          sideOffset={8}
          className="z-[var(--z-popover)] w-72 rounded-[var(--radius-lg)] border border-neutral-200 bg-neutral-0 p-4 shadow-[var(--shadow-lg)] animate-[var(--animate-scale-in)]"
        >
          {children}
          <HoverCardPrimitive.Arrow className="fill-neutral-0" />
        </HoverCardPrimitive.Content>
      </HoverCardPrimitive.Portal>
    </HoverCardPrimitive.Root>
  );
}
