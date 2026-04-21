import type { ReactNode } from "react";

export default function ProgressLayout({ children }: { children: ReactNode }) {
  return <div className="h-full">{children}</div>;
}
