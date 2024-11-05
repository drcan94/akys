import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/src/server/auth";
import { MainNav } from "@/src/components/layout/main-nav";
import { UserNav } from "@/src/components/layout/user-nav";
import { ModeToggle } from "@/src/components/layout/mode-toggle";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerAuthSession();

  if (!session) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <MainNav userRole={session.user.role} />
          <div className="ml-auto flex items-center space-x-4">
            <ModeToggle />
            <UserNav
              user={{
                name: session.user.name,
                email: session.user.email,
                image: session.user.image,
                role: session.user.role,
              }}
            />
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="container py-6">{children}</div>
      </main>
    </div>
  );
}
