// app/plan/page.jsx
"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export default function PlanPage() {
  const [period, setPeriod] = useState("week");
  const [mpd, setMpd] = useState(2);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const router = useRouter();

  const generate = useCallback(async () => {
    setErr("");
    setLoading(true);
    try {
      const res = await fetch("/api/plan/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period, mealsPerDay: mpd }),
      });

      if (res.status === 401) {
        router.replace("/auth/login?callbackUrl=/plan");
        return;
      }
      if (res.status === 400) {
        // onboarding incomplete
        router.replace("/onboarding");
        return;
      }
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to generate");
      }

      const d = await res.json();
      setPlan(d.plan);
    } catch (e) {
      setErr(e.message || "Failed to generate");
    } finally {
      setLoading(false);
    }
  }, [period, mpd, router]);

  // auto-generate on first load (and optionally when period/mpd change)
  useEffect(() => {
    generate();
  }, [generate]);

  return (
    <main className="mx-auto max-w-2xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Your plan</h1>

      <div className="flex gap-3">
        <select className="border rounded px-3 py-2" value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="day">Day</option>
          <option value="week">Week</option>
        </select>
        <select className="border rounded px-3 py-2" value={mpd} onChange={(e) => setMpd(Number(e.target.value))}>
          <option value={2}>2 meals/day</option>
          <option value={3}>3 meals/day</option>
        </select>
        <button onClick={generate} className="rounded bg-black text-white px-4">
          {loading ? "Generating…" : "Generate"}
        </button>
      </div>

      {err && <p className="text-red-600 text-sm">{err}</p>}

      {!plan ? (
        <p>{loading ? "Generating..." : "No plan yet."}</p>
      ) : (
        <section className="space-y-4">
          {plan.days.map((d, i) => (
            <div key={i} className="border rounded p-4">
              <h2 className="font-semibold">{d.day}</h2>
              <ul className="mt-2 space-y-2">
                {d.meals.map((m, j) => (
                  <li key={j} className="border rounded p-3">
                    <div className="font-medium">{m.name}</div>
                    <div className="text-sm text-gray-600">
                      {m.macros.kcal} kcal • P{m.macros.protein} C{m.macros.carb} F{m.macros.fat}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
