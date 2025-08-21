// app/verify/page.jsx
"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function VerifyPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const params = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const e = params.get("email");
    if (e) setEmail(e);
  }, [params]);

  async function onSubmit(e) {
    e.preventDefault();
    setErr(""); setMsg(""); setLoading(true);
    try {
      // ensure this matches your route path (you had /api/verify earlier)
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok || !d?.ok) throw new Error(d?.error || "Verification failed");
      setMsg("Verified! Redirecting…");
      router.replace("/auth/login?verified=1");
    } catch (e) {
      setErr(e.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  }




  async function onResend() {
  setErr(""); setMsg(""); setResending(true);
  try {
    const r = await fetch("/api/verify/resend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const d = await r.json().catch(() => ({}));

    // 👇 handle cooldown
    if (r.status === 429 && d?.retryIn) {
      setErr(`Please wait ${d.retryIn}s before resending.`);
      return;
    }

    if (!r.ok) {
      setErr(d?.error || "Could not resend code");
      return;
    }

    setMsg("Code resent. Check your inbox.");
  } catch (e) {
    setErr(e.message || "Could not resend code");
  } finally {
    setResending(false);
  }
}


  const emailMasked =
    email ? email.replace(/(.{2}).+(@.*)/, (_m, a, b) => `${a}***${b}`) : "";

  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="text-2xl font-semibold mb-2">Verify your email</h1>

      {!email ? (
        <p className="text-sm text-red-600">
          Missing email. Please open the link from your email or{" "}
          <a className="underline" href="/auth/login">go back to login</a>.
        </p>
      ) : (
        <>
          <p className="text-sm text-gray-600 mb-4">
            Enter the 6‑digit code sent to <b>{emailMasked}</b>.
          </p>

          <form onSubmit={onSubmit} className="space-y-3">
            <input
              className="w-full border rounded px-3 py-2"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
            />

            {err && <p className="text-sm text-red-600">{err}</p>}
            {msg && <p className="text-sm text-green-700">{msg}</p>}

            <button
              disabled={loading || !code || code.length < 6}
              className="w-full rounded bg-black text-white py-2 disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify"}
            </button>
          </form>

          <div className="mt-3 text-sm flex items-center justify-between">
            <button
              type="button"
              onClick={onResend}
              disabled={resending}
              className="underline"
            >
              {resending ? "Resending…" : "Resend code"}
            </button>
            <a className="underline" href="/auth/login">Use a different email</a>
          </div>
        </>
      )}
    </main>
  );
}
