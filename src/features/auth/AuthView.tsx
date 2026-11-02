import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { errorMessage } from "@/services/api";
import { useLogin, useRegister } from "@/services/queries";

type Mode = "login" | "register" | "forgot";

const MIN_PASSWORD_LENGTH = 8;

export function AuthView() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" });
  const [mode, setMode] = useState<Mode>((search.mode as Mode) || "login");
  const [error, setError] = useState<string | null>(null);
  // Accounts are rows of the users table: both calls go through the backend API.
  const login = useLogin();
  const register = useRegister();
  const busy = login.isPending || register.isPending;

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const name = String(data.get("name") ?? "").trim();
    const password = String(data.get("password") ?? "");

    if (!email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    if (mode === "register" && !name) {
      setError("Please enter your name.");
      return;
    }
    if (mode === "register" && password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    try {
      if (mode === "register") {
        await register.mutateAsync({ name, email, password });
      } else {
        await login.mutateAsync({ email, password });
      }
      navigate({ to: "/dashboard" });
    } catch (err: unknown) {
      setError(errorMessage(err));
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground lg:flex">
        <div className="bg-texture" />
        <Link to="/" className="relative flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-foreground/15">
            <Icon name="eco" filled />
          </span>
          <span className="font-display text-xl font-semibold">ProCrop</span>
        </Link>
        <div className="relative max-w-md">
          <h2 className="font-display text-4xl font-semibold leading-tight">
            Every alert with a reason and a next action.
          </h2>
          <p className="mt-4 text-primary-foreground/80">
            Soil, weather, crop history and leaf imagery fused into one explainable risk view for
            every field you manage.
          </p>
        </div>
        <p className="relative text-sm text-primary-foreground/70">
          Monitor → Predict → Explain → Recommend
        </p>
      </div>

      <div className="flex items-center justify-center px-5 py-16">
        <div className="w-full max-w-md">
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary lg:hidden"
          >
            <Icon name="arrow_back" className="text-[18px]" />
            Back to home
          </Link>

          <h1 className="font-display text-3xl font-semibold">
            {mode === "login"
              ? "Welcome back"
              : mode === "register"
                ? "Create your account"
                : "Reset password"}
          </h1>
          <p className="mt-2 text-sm text-foreground/70">
            {mode === "login"
              ? "Sign in to your ProCrop workspace."
              : mode === "register"
                ? "Register your farm and start monitoring in minutes."
                : "Password reset by email is not available."}
          </p>

          {mode === "forgot" ? (
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-border bg-muted/40 p-4 text-sm">
              <Icon name="mail_off" className="text-muted-foreground" />
              <div>
                <p className="font-semibold">Reset links cannot be sent</p>
                <p className="text-foreground/70">
                  No email service is configured for this ProCrop installation, so a password cannot
                  be reset from here.
                </p>
              </div>
            </div>
          ) : (
            <form key={mode} onSubmit={submit} className="mt-8 space-y-4">
              {mode === "register" ? (
                <Field label="Full name" name="name" placeholder="Your full name" />
              ) : null}
              <Field
                label="Email (Mail ID)"
                name="email"
                type="email"
                placeholder="you@example.com"
              />
              <Field
                label="Password"
                name="password"
                type="password"
                placeholder={
                  mode === "register" ? `At least ${MIN_PASSWORD_LENGTH} characters` : "••••••••"
                }
              />

              {error ? (
                <p
                  role="alert"
                  className="flex items-center gap-2 rounded-xl bg-critical/10 px-3 py-2 text-sm text-critical"
                >
                  <Icon name="error" className="text-[18px]" />
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                {busy ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                ) : null}
                {mode === "login" ? "Sign in" : "Create account"}
              </button>
            </form>
          )}

          <div className="mt-6 space-y-2 text-sm">
            {mode !== "login" ? (
              <button className="text-primary hover:underline" onClick={() => switchMode("login")}>
                Already have an account? Sign in
              </button>
            ) : (
              <>
                <button
                  className="block text-primary hover:underline"
                  onClick={() => switchMode("register")}
                >
                  New to ProCrop? Create an account
                </button>
                <button
                  className="block text-muted-foreground hover:underline"
                  onClick={() => switchMode("forgot")}
                >
                  Forgot your password?
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required = true,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary"
      />
    </label>
  );
}
