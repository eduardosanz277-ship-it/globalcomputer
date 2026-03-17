import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">Next + Supabase Starter</h1>
        <p className="text-muted-foreground max-w-xl">
          Proyecto base con App Router, Server Actions, Supabase, TailwindCSS,
          shadcn/ui, React-Toastify y TanStack Table.
        </p>
      </div>
      <div className="flex gap-4">
        <Link
          href="/auth/login"
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
        >
          Ir al login
        </Link>
        <Link
          href="/dashboard"
          className="rounded-md border border-input px-4 py-2 text-sm"
        >
          Ir al dashboard
        </Link>
      </div>
    </main>
  );
}

