import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff, LogIn, PackageSearch, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useData } from "@/lib/farazz/store";
import { useI18n, LANGUAGES } from "@/lib/i18n";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — FARAZZ FLOW" },
      { name: "description", content: "Sign in to the FARAZZ FLOW operations platform." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { db } = useData();
  const { setLang } = useI18n();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const quickUsers = [
    { label: "Super Admin", email: "dimas.prakoso@farazzflow.example.com" },
    { label: "Operations", email: "andi.prasetyo@farazzflow.example.com" },
  ];

  const submit = (e: FormEvent, userEmail?: string) => {
    e.preventDefault();
    const targetEmail = (userEmail ?? email).trim().toLowerCase();
    const user = db.users.find((u) => u.email.toLowerCase() === targetEmail);

    if (!user || password.length === 0) {
      setError("Invalid email or password. Use a demo account below or any password.");
      return;
    }
    setError(null);
    if (remember && targetEmail) localStorage.setItem("farazz.session.email", targetEmail);

    toast.success(`Welcome back, ${user.name}!`);
    navigate({ to: "/" });
  };

  const quickSignIn = (demoEmail: string) => {
    if (remember) localStorage.setItem("farazz.session.email", demoEmail.toLowerCase());
    toast.success(`Signed in as ${demoEmail}`);
    navigate({ to: "/" });
  };

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-5 py-4">
        <span className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <PackageSearch className="h-5 w-5" aria-hidden />
          </span>
          <span className="text-lg font-semibold tracking-tight text-foreground">FARAZZ FLOW</span>
        </span>
        <div className="flex items-center gap-1.5">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => setLang(l.code)}
              className="rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {l.flag} {l.code.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      {/* Card */}
      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Sign in to your workspace</h1>
          <p className="mt-1 text-sm text-muted-foreground">Enterprise logistics operations for shipments, warehousing, fleet and finance.</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs text-muted-foreground">
                Work email
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@farazzflow.example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs text-muted-foreground">
                  Password
                </Label>
                <button type="button" className="text-xs font-medium text-primary hover:underline" onClick={() => toast.info("Password reset is available in the production build.")}>
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox id="remember" checked={remember} onCheckedChange={(v) => setRemember(v === true)} />
              <label htmlFor="remember" className="text-sm text-muted-foreground">
                Keep me signed in
              </label>
            </div>

            {error ? <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">{error}</p> : null}

            <Button type="submit" disabled={!email.trim() || !password} className="w-full gap-1.5">
              <LogIn className="h-4 w-4" aria-hidden /> Sign in
            </Button>
          </form>

          <div className="mt-5">
            <div className="relative flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> Demo accounts <span className="h-px flex-1 bg-border" />
            </div>
            <div className="mt-3 grid gap-2">
              {quickUsers.map((q) => (
                <button
                  key={q.email}
                  type="button"
                  onClick={() => quickSignIn(q.email)}
                  className="flex items-center justify-between rounded-md border border-border px-3.5 py-2.5 text-left transition-colors hover:bg-accent"
                >
                  <span className="text-sm font-medium text-foreground">{q.label}</span>
                  <span className="truncate pl-3 text-xs text-muted-foreground">{q.email}</span>
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              This is a demo workspace. Quick-access accounts are derived from the users directory.
            </p>
          </div>
        </div>
      </main>

      <footer className="flex items-center justify-center gap-2 px-4 pb-6 text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> Protected by FARAZZ FLOW access controls
      </footer>
    </div>
  );
}