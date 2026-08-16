import * as React from "react";
import Link from "next/link";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import * as ContextMenuPrimitive from "@radix-ui/react-context-menu";
import { Command as CommandPrimitive } from "cmdk";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ChevronRight, MoreHorizontal, Check, Search, Circle } from "lucide-react";
import { cn } from "../../utils/cn";
import { transitionFast } from "./shared";

/* ---------------------------------------------------------------------
   Nav item / Menu item (generic, no app-specific meaning)
   --------------------------------------------------------------------- */
type NavItemBaseProps = {
  icon?: React.ReactNode;
  children: React.ReactNode;
  active?: boolean;
  badge?: React.ReactNode;
  className?: string;
};

type NavItemButtonProps = NavItemBaseProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className"> & {
    href?: never;
  };

type NavItemLinkProps = NavItemBaseProps &
  Omit<React.ComponentPropsWithoutRef<typeof Link>, "children" | "className" | "href"> & {
    href: string;
  };

export type NavItemProps = NavItemButtonProps | NavItemLinkProps;

function getNavItemClassName(active?: boolean, className?: string) {
  return cn(
    "flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium outline-none",
    active ? "bg-primary-50 text-primary-700" : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
    "focus-visible:ring-[3px] focus-visible:ring-primary-200",
    transitionFast,
    className,
  );
}

function NavItemContent({
  icon,
  children,
  badge,
}: Pick<NavItemBaseProps, "icon" | "children" | "badge">) {
  return (
    <>
      {icon && <span className="shrink-0 size-4">{icon}</span>}
      <span className="flex-1 text-start truncate">{children}</span>
      {badge}
    </>
  );
}

export function NavItem(props: NavItemProps) {
  if ("href" in props && props.href) {
    const { href, icon, children, active, badge, className, ...linkProps } = props as NavItemLinkProps;

    return (
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={getNavItemClassName(active, className)}
        {...linkProps}
      >
        <NavItemContent icon={icon} badge={badge}>
          {children}
        </NavItemContent>
      </Link>
    );
  }

  const {
    icon,
    children,
    active,
    badge,
    className,
    type = "button",
    ...buttonProps
  } = props as NavItemButtonProps;

  return (
    <button
      type={type}
      aria-pressed={active || undefined}
      className={cn(
        getNavItemClassName(active, className),
        "disabled:opacity-[var(--opacity-disabled)] disabled:pointer-events-none",
      )}
      {...buttonProps}
    >
      <NavItemContent icon={icon} badge={badge}>
        {children}
      </NavItemContent>
    </button>
  );
}

export function MenuItem({
  icon,
  children,
  shortcut,
  destructive,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { icon?: React.ReactNode; shortcut?: string; destructive?: boolean }) {
  return (
    <button
      className={cn(
        "flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-2 text-sm outline-none",
        destructive ? "text-danger-600 hover:bg-danger-50" : "text-neutral-700 hover:bg-neutral-100",
        "disabled:opacity-[var(--opacity-disabled)] disabled:pointer-events-none",
        transitionFast,
        className,
      )}
      {...props}
    >
      {icon && <span className="shrink-0 size-4">{icon}</span>}
      <span className="flex-1 text-start">{children}</span>
      {shortcut && <span className="text-xs text-neutral-400">{shortcut}</span>}
    </button>
  );
}

/* ---------------------------------------------------------------------
   Breadcrumb
   --------------------------------------------------------------------- */
export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && <ChevronRight className="size-3.5 text-neutral-300 rtl:rotate-180" />}
          {item.href && i !== items.length - 1 ? (
            <a href={item.href} className="text-neutral-500 hover:text-neutral-800 transition-colors">
              {item.label}
            </a>
          ) : (
            <span className={cn(i === items.length - 1 ? "font-medium text-neutral-900" : "text-neutral-500")}>{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

/* ---------------------------------------------------------------------
   Pagination
   --------------------------------------------------------------------- */
export function Pagination({
  page,
  pageCount,
  onPageChange,
  previousLabel = "Previous",
  nextLabel = "Next",
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  previousLabel?: string;
  nextLabel?: string;
}) {
  const pages = Array.from({ length: pageCount }).map((_, i) => i + 1);
  return (
    <nav className="flex items-center gap-1.5">
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="h-8 px-3 rounded-[var(--radius-sm)] text-sm font-medium text-neutral-600 hover:bg-neutral-100 disabled:opacity-[var(--opacity-disabled)] disabled:pointer-events-none"
      >
        {previousLabel}
      </button>
      <div className="flex items-center gap-1">
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={cn(
              "size-8 rounded-[var(--radius-sm)] text-sm font-medium",
              p === page ? "bg-primary-600 text-neutral-0" : "text-neutral-600 hover:bg-neutral-100",
              transitionFast,
            )}
          >
            {p}
          </button>
        ))}
      </div>
      <button
        onClick={() => onPageChange(Math.min(pageCount, page + 1))}
        disabled={page === pageCount}
        className="h-8 px-3 rounded-[var(--radius-sm)] text-sm font-medium text-neutral-600 hover:bg-neutral-100 disabled:opacity-[var(--opacity-disabled)] disabled:pointer-events-none"
      >
        {nextLabel}
      </button>
    </nav>
  );
}

/* ---------------------------------------------------------------------
   Stepper
   --------------------------------------------------------------------- */
export function Stepper({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <ol className="flex items-center w-full">
      {steps.map((step, i) => {
        const state = i < current ? "done" : i === current ? "active" : "upcoming";
        return (
          <li key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  state === "done" && "bg-primary-600 text-neutral-0",
                  state === "active" && "bg-primary-50 text-primary-700 ring-2 ring-primary-500",
                  state === "upcoming" && "bg-neutral-100 text-neutral-400",
                )}
              >
                {state === "done" ? <Check className="size-3.5" /> : i + 1}
              </div>
              <span className={cn("text-sm font-medium whitespace-nowrap", state === "upcoming" ? "text-neutral-400" : "text-neutral-800")}>
                {step}
              </span>
            </div>
            {i < steps.length - 1 && <div className={cn("mx-3 h-px flex-1", state === "done" ? "bg-primary-300" : "bg-neutral-200")} />}
          </li>
        );
      })}
    </ol>
  );
}

/* ---------------------------------------------------------------------
   Dropdown menu
   --------------------------------------------------------------------- */
export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

export function DropdownMenuContent({ className, sideOffset = 6, ...props }: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          "z-[var(--z-dropdown)] min-w-[12rem] rounded-[var(--radius-md)] border border-neutral-200 bg-neutral-0 p-1.5 shadow-[var(--shadow-lg)] outline-none animate-[var(--animate-scale-in)]",
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

export function DropdownMenuItem({ className, ...props }: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item>) {
  return (
    <DropdownMenuPrimitive.Item
      className={cn(
        "flex items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-2 text-sm text-neutral-700 outline-none cursor-pointer",
        "data-[highlighted]:bg-neutral-100",
        "data-[disabled]:opacity-[var(--opacity-disabled)] data-[disabled]:pointer-events-none",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({ className, ...props }: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>) {
  return <DropdownMenuPrimitive.Separator className={cn("my-1.5 h-px bg-neutral-100", className)} {...props} />;
}

export function DropdownMenuLabel({ className, ...props }: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label>) {
  return <DropdownMenuPrimitive.Label className={cn("px-2.5 py-1.5 text-xs font-medium uppercase tracking-wide text-neutral-400", className)} {...props} />;
}

export { MoreHorizontal as MoreIcon };

/* ---------------------------------------------------------------------
   Context menu
   --------------------------------------------------------------------- */
export const ContextMenu = ContextMenuPrimitive.Root;
export const ContextMenuTrigger = ContextMenuPrimitive.Trigger;

export function ContextMenuContent({ className, ...props }: React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Content>) {
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Content
        className={cn(
          "z-[var(--z-dropdown)] min-w-[12rem] rounded-[var(--radius-md)] border border-neutral-200 bg-neutral-0 p-1.5 shadow-[var(--shadow-lg)] outline-none animate-[var(--animate-scale-in)]",
          className,
        )}
        {...props}
      />
    </ContextMenuPrimitive.Portal>
  );
}

export function ContextMenuItem({ className, ...props }: React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Item>) {
  return (
    <ContextMenuPrimitive.Item
      className={cn(
        "flex items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-2 text-sm text-neutral-700 outline-none cursor-pointer",
        "data-[highlighted]:bg-neutral-100",
        className,
      )}
      {...props}
    />
  );
}

/* ---------------------------------------------------------------------
   Command menu (⌘K style)
   --------------------------------------------------------------------- */
export function CommandMenu({
  open,
  onOpenChange,
  groups,
  placeholder = "Type a command or search…",
  emptyLabel = "No results found.",
  title = "Command menu",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: { heading: string; items: { label: string; icon?: React.ReactNode; shortcut?: string }[] }[];
  placeholder?: string;
  emptyLabel?: string;
  title?: string;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[var(--z-modal)] bg-neutral-900/[var(--opacity-backdrop)] animate-[var(--animate-fade-in)]" />
        <DialogPrimitive.Content className="fixed left-1/2 top-24 z-[var(--z-modal)] w-full max-w-lg -translate-x-1/2 overflow-hidden rounded-[var(--radius-lg)] border border-neutral-200 bg-neutral-0 shadow-[var(--shadow-xl)] animate-[var(--animate-slide-down)]">
          <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
          <CommandPrimitive>
            <div className="flex items-center gap-2.5 border-b border-neutral-100 px-4">
              <Search className="size-4 text-neutral-400" />
              <CommandPrimitive.Input
                autoFocus
                placeholder={placeholder}
                className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-neutral-400"
              />
            </div>
            <CommandPrimitive.List className="max-h-80 overflow-y-auto p-2">
              <CommandPrimitive.Empty className="py-8 text-center text-sm text-neutral-400">{emptyLabel}</CommandPrimitive.Empty>
              {groups.map((group) => (
                <CommandPrimitive.Group
                  key={group.heading}
                  heading={group.heading}
                  className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-neutral-400"
                >
                  {group.items.map((item) => (
                    <CommandPrimitive.Item
                      key={item.label}
                      className="flex items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-2.5 text-sm text-neutral-700 aria-selected:bg-primary-50 aria-selected:text-primary-800 cursor-pointer"
                    >
                      {item.icon ?? <Circle className="size-3.5 text-neutral-300" />}
                      <span className="flex-1">{item.label}</span>
                      {item.shortcut && <span className="text-xs text-neutral-400">{item.shortcut}</span>}
                    </CommandPrimitive.Item>
                  ))}
                </CommandPrimitive.Group>
              ))}
            </CommandPrimitive.List>
          </CommandPrimitive>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
