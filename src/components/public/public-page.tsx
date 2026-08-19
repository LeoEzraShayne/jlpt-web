import { PublicFooter } from "./public-footer";
import { PublicHeader } from "./public-header";

export function PublicPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      {children}
      <PublicFooter />
    </div>
  );
}
