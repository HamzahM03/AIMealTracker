"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const router = useRouter();

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");

    const normalizedEmail = email.trim().toLowerCase();

    if (pw !== pw2) {
      setErr("Passwords do not match.");
      return;
    }
    if (pw.length < 6) {
      setErr("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      // hit your signup API
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: normalizedEmail, password: pw })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        // 409 = email in use (we’ll implement below)
        const message = data?.error || (res.status === 409 ? "Email already in use" : "Registration failed");
        throw new Error(message);
      }

      // auto login user using NextAuth credentials provider
      const login = await signIn("credentials", {
        email: normalizedEmail,
        password: pw,
        redirect: false
      });

      if (login?.error) {
        // fallback: send to login page if auto-login fails
        router.replace("/auth/login");
        return;
      }
      router.replace("/onboarding");
    } catch (e) {
      setErr(e.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto w-full max-w-sm space-y-4" aria-busy={loading}>
      <h1 className="text-2xl font-semibold">Create account</h1>

      <label className="block space-y-1" htmlFor="name">
        <span className="text-sm text-gray-700">Name</span>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
          placeholder="Your name"
        />
      </label>

      <label className="block space-y-1" htmlFor="email">
        <span className="text-sm text-gray-700">Email</span>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
          placeholder="you@example.com"
        />
      </label>

      <label className="block space-y-1" htmlFor="password">
        <span className="text-sm text-gray-700">Password</span>
        <div className="flex items-stretch">
          <input
            id="password"
            type={showPw ? "text" : "password"}
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            className="w-full rounded-l-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
            placeholder="At least 6 characters"
          />
          <button
            type="button"
            onClick={() => setShowPw((s) => !s)}
            className="rounded-r-xl border border-l-0 border-gray-300 px-3 text-sm text-gray-700 hover:bg-gray-50"
            aria-pressed={showPw}
            aria-label={showPw ? "Hide password" : "Show password"}
          >
            {showPw ? "Hide" : "Show"}
          </button>
        </div>
      </label>

      <label className="block space-y-1" htmlFor="password2">
        <span className="text-sm text-gray-700">Confirm password</span>
        <input
          id="password2"
          type={showPw ? "text" : "password"}
          value={pw2}
          onChange={(e) => setPw2(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
          placeholder="Repeat password"
        />
      </label>

      {err && <p className="text-sm text-red-600" role="alert">{err}</p>}

      <button
        type="submit"
        disabled={loading}
        className={`w-full rounded-xl px-4 py-2 text-sm font-medium text-white ${loading ? "bg-black/70" : "bg-black hover:bg-black/90"}`}
      >
        {loading ? "Creating…" : "Create account"}
      </button>

      <p className="text-center text-sm text-gray-600">
        Already have an account? <a className="underline" href="/auth/login">Login</a>
      </p>
    </form>
  );
}
