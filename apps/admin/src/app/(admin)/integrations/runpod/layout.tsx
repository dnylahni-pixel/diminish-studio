import type { ReactNode } from "react";
import { RunpodSubNav } from "./_components/runpod-sub-nav";

export default function RunpodLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col h-full">
      <RunpodSubNav />
      <div className="flex-1 p-6 max-sm:p-4">{children}</div>
    </div>
  );
}
