import { NavBar } from "@/components/nav-bar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh bg-[var(--background)] pb-24">
      {children}
      <NavBar />
    </div>
  );
}
