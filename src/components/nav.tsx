import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui";

export async function Nav() {
  const session = await auth();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-3 py-3 sm:px-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm font-semibold text-slate-900">
            Assembly
          </Link>
          {session?.user && (
            <nav className="flex gap-3 text-sm text-slate-600">
              <Link href="/" className="hover:text-slate-900">
                Assemblies
              </Link>
              <Link href="/partners" className="hover:text-slate-900">
                Partners
              </Link>
              <Link href="/questionnaire" className="hover:text-slate-900">
                Questionnaire
              </Link>
            </nav>
          )}
        </div>
        {session?.user && (
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <Button type="submit" variant="ghost">
              Sign out
            </Button>
          </form>
        )}
      </div>
    </header>
  );
}
