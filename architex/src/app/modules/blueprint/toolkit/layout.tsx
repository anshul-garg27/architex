import type { ReactNode } from "react";

export default function ToolkitLayout({ children }: { children: ReactNode }) {
  return <div className="h-full">{children}</div>;
}
