export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full overflow-y-auto scroll-smooth">
      {children}
    </div>
  );
}
