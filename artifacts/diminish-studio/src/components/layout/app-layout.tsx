import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { Music, Library, GraduationCap, Upload, User, Menu, Sun, Moon, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/use-theme";
import { UploadIndicator } from "@/components/layout/upload-indicator";

export function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { toggle, isDark } = useTheme();

const navItems = [
  { href: "/music-hub", label: "Music Hub", icon: Music },
  { href: "/library", label: "Library", icon: Library },
  { href: "/learn", label: "Learn", icon: GraduationCap },
  { href: "/process", label: "Process", icon: Upload },
  { href: "/profile", label: "Profile", icon: User },
];

  return (
    <div className="flex w-full bg-background overflow-hidden selection:bg-primary/30" style={{ height: "100dvh" }}>

      {/* ── Desktop Sidebar ──────────────────────────────────────────────── */}
      <aside
        className={cn(
          "hidden md:flex flex-col h-full bg-sidebar border-r border-sidebar-border text-sidebar-foreground transition-all duration-300 overflow-hidden flex-shrink-0",
          collapsed ? "w-14" : "w-56"
        )}
      >
        {/* Logo */}
        <div className={cn(
          "flex items-center gap-2 h-14 px-3 border-b border-sidebar-border flex-shrink-0",
          collapsed ? "justify-center" : "justify-between"
        )}>
          {!collapsed && (
            <div className="flex items-center gap-2 min-w-0">
              <div className="bg-primary/20 p-1.5 rounded-lg text-primary flex-shrink-0">
                <Music className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm tracking-tight truncate">DiminishStudio</span>
            </div>
          )}
          {collapsed && (
            <div className="bg-primary/20 p-1.5 rounded-lg text-primary">
              <Music className="w-4 h-4" />
            </div>
          )}
          <button
            onClick={() => setCollapsed(p => !p)}
            className={cn(
              "text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors flex-shrink-0",
              collapsed && "hidden"
            )}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Expand button when collapsed */}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="mx-auto mt-2 text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors p-1.5"
            title="Expand sidebar"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        )}

        {/* Nav */}
        <nav className="flex flex-col gap-1 flex-1 px-2 py-3">
          {navItems.map((item) => {
            const isActive = location.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 px-2.5 py-2 rounded-md transition-all duration-200 text-sm font-medium",
                  collapsed ? "justify-center" : "",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: upload indicator + theme toggle */}
        <div
          className={cn(
            "flex-shrink-0 border-t border-sidebar-border",
            collapsed ? "px-2 py-2 flex flex-col items-center gap-2" : "px-3 py-2 flex flex-col gap-1"
          )}
        >
          <UploadIndicator compact />

          <div className={cn(
            "flex",
            collapsed ? "justify-center" : "items-center justify-between"
          )}>
            {!collapsed && (
              <span className="text-[10px] text-sidebar-foreground/40 tracking-widest uppercase">
                v1.0.0
              </span>
            )}
            <button
              onClick={toggle}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className="text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors p-1.5 rounded-md hover:bg-sidebar-accent/40"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </aside>

        {/* ── Mobile Header ────────────────────────────────────────────────── */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 border-b border-border bg-background/90 backdrop-blur-md z-50 flex flex-col"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.5rem)" }}
      >
        <div className="flex items-end justify-between px-4 pb-2">
          <div className="flex items-center gap-1">
            <button
              onClick={toggle}
              className="text-foreground/60 hover:text-foreground transition-colors p-1.5"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-foreground">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-56 border-r-border bg-sidebar">
                <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground p-4 gap-5">
                  <div className="flex items-center gap-2 px-1">
                    <div className="bg-primary/20 p-1.5 rounded-lg text-primary">
                      <Music className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-sm tracking-tight">DiminishStudio</span>
                  </div>
                  <nav className="flex flex-col gap-1">
                    {navItems.map((item) => {
                      const isActive = location.startsWith(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setSheetOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-md transition-all text-sm font-medium",
                            isActive
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                          )}
                        >
                          <item.icon className="w-4 h-4" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
        {/* Upload indicator in mobile header (non-compact) */}
        <UploadIndicator compact={false} />
      </div>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <main
        className="flex-1 h-full overflow-y-auto relative md:pt-0 min-w-0"
        style={{ paddingTop: "max(3.5rem, calc(env(safe-area-inset-top) + 2.5rem))" }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--color-primary)_0%,transparent_40%)] opacity-5 pointer-events-none" />
        {children}
      </main>
    </div>
  );
}
