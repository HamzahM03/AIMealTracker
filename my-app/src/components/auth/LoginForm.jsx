"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);

    const normalizedEmail = email.trim().toLowerCase();

    try {
      const res = await signIn("credentials", {
        email: normalizedEmail,
        password,
        redirect: false,
      });

      setLoading(false);

      // Success → honor callbackUrl or go to /plan
      if (res?.ok) {
        const cb = searchParams.get("callbackUrl");
        router.replace(cb || "/plan");
        return;
      }

      // Failed sign-in. Check if it's the *correct password* but unverified.
      if (res?.error === "CredentialsSignin") {
        try {
          const r = await fetch("/api/auth/lookup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: normalizedEmail, password }),
          });
          const data = await r.json().catch(() => ({}));
          if (data?.unverified === true) {
            router.replace(`/verify?email=${encodeURIComponent(normalizedEmail)}`);
            return;
          }
        } catch {
          // ignore; fall through to generic error
        }
      }

      setErr("Invalid email or password");
    } catch (e) {
      setLoading(false);
      setErr("Something went wrong. Please try again.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto w-full max-w-sm space-y-4">
      <h1 className="text-2xl font-semibold">Login</h1>

      <label className="block space-y-1">
        <span className="text-sm text-gray-700">Email</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
          placeholder="you@example.com"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm text-gray-700">Password</span>
        <div className="flex items-stretch">
          <input
            type={showPw ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-l-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPw((s) => !s)}
            className="rounded-r-xl border border-l-0 border-gray-300 px-3 text-sm text-gray-700 hover:bg-gray-50"
          >
            {showPw ? "Hide" : "Show"}
          </button>
        </div>
      </label>

      {err && <p className="text-sm text-red-600">{err}</p>}

      <button
        type="submit"
        disabled={loading}
        className={`w-full rounded-xl px-4 py-2 text-sm font-medium text-white ${
          loading ? "bg-black/70" : "bg-black hover:bg-black/90"
        }`}
      >
        {loading ? "Logging in…" : "Login"}
      </button>

      <p className="text-center text-sm text-gray-600">
        Don’t have an account? <a className="underline" href="/auth/register">Register</a>
      </p>
    </form>
  );
}
