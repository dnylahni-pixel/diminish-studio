import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Music, Library, GraduationCap, Upload, User, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/library", label: "Library", icon: Library },
    { href: "/learn", label: "Learn", icon: GraduationCap },
    { href: "/process", label: "Process", icon: Upload },
    { href: "/profile", label: "Profile", icon: User },
  ];

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-sidebar border-r border-sidebar-border text-sidebar-foreground w-64 p-4 gap-6">
      <div className="flex items-center gap-2 px-2">
        <div className="bg-primary/20 p-2 rounded-lg text-primary">
          <Music className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">DiminishStudio</h1>
      </div>
      
      <nav className="flex flex-col gap-2 flex-1">
        {navItems.map((item) => {
          const isActive = location.startsWith(item.href);
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 text-sm font-medium",
                isActive 
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm" 
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      
      <div className="mt-auto pt-4 border-t border-sidebar-border px-2">
        <p className="text-xs text-sidebar-foreground/50 text-center">
          DiminishStudio v1.0.0
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden selection:bg-primary/30">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <SidebarContent />
      </div>

      {/* Mobile Header & Sidebar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 border-b border-border bg-background/80 backdrop-blur-md z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2 text-primary">
          <Music className="w-5 h-5" />
          <span className="font-bold">DiminishStudio</span>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-foreground">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 border-r-border bg-sidebar">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-y-auto relative md:pt-0 pt-14">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--color-primary)_0%,transparent_40%)] opacity-5 pointer-events-none" />
        {children}
      </main>
    </div>
  );
}
