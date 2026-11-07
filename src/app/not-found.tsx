import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8 text-center">
      <h2 className="text-3xl font-bold tracking-tight">404 - Page Not Found</h2>
      <p className="text-muted-foreground max-w-md">
        The requested page does not exist or has been moved.
      </p>
      <Link
        href="/dashboard"
        className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm transition-opacity hover:opacity-90"
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
