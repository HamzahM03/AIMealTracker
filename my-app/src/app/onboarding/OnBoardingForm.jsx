"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const GOAL_OPTIONS = [
  { value: "lose_weight", label: "Lose weight" },
  { value: "maintain",    label: "Maintain" },
  { value: "gain",        label: "Gain" },
];
const ACTIVITY_OPTIONS = [
  { value: "sedentary", label: "Sedentary" },
  { value: "light",     label: "Light" },
  { value: "moderate",  label: "Moderate" },
  { value: "active",    label: "Active" },
];

export default function OnBoardingPage() {
  const router = useRouter();
  const [goal, setGoal] = useState("maintain");
  const [activity, setActivity] = useState("light");
  const [heightValue, setHV] = useState("");
  const [heightUnit, setHU] = useState("cm");
  const [weightValue, setWV] = useState("");
  const [weightUnit, setWU] = useState("kg");
  const [exclusionsText, setExclusionsText] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr(""); setLoading(true);
    const exclusions = exclusionsText.split(",").map(s=>s.trim()).filter(Boolean);

    const res = await fetch("/api/onboarding/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        goal: { target: goal, activityLevel: activity, calories: null },
        height: { value: Number(heightValue), unit: heightUnit },
        weight: { value: Number(weightValue), unit: weightUnit },
        preferences: { exclusions, unitsPref: weightUnit === "lb" ? "imperial" : "metric" }
      })
    });
    setLoading(false);

    if (!res.ok) {
      const d = await res.json().catch(()=>({}));
      setErr(d.error || "Failed to save");
      return;
    }
    router.replace("/plan");
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-4">Tell us the basics</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Goal</label>
          <select className="w-full border rounded px-3 py-2" value={goal} onChange={e=>setGoal(e.target.value)}>
            {GOAL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1">Activity level</label>
          <select className="w-full border rounded px-3 py-2" value={activity} onChange={e=>setActivity(e.target.value)}>
            {ACTIVITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">Height</label>
            <input className="w-full border rounded px-3 py-2" type="number" required
                   value={heightValue} onChange={e=>setHV(e.target.value)} placeholder="e.g. 175" />
          </div>
          <div>
            <label className="block text-sm mb-1">Unit</label>
            <select className="w-full border rounded px-3 py-2" value={heightUnit} onChange={e=>setHU(e.target.value)}>
              <option value="cm">cm</option><option value="in">in</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Weight</label>
            <input className="w-full border rounded px-3 py-2" type="number" required
                   value={weightValue} onChange={e=>setWV(e.target.value)} placeholder="e.g. 70" />
          </div>
          <div>
            <label className="block text-sm mb-1">Unit</label>
            <select className="w-full border rounded px-3 py-2" value={weightUnit} onChange={e=>setWU(e.target.value)}>
              <option value="kg">kg</option><option value="lb">lb</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1">Allergies / foods to avoid</label>
          <input className="w-full border rounded px-3 py-2" placeholder="peanuts, pork, shellfish"
                 value={exclusionsText} onChange={e=>setExclusionsText(e.target.value)} />
        </div>

        {err && <p className="text-sm text-red-600">{err}</p>}
        <button disabled={loading} className="w-full rounded bg-black text-white py-2">
          {loading ? "Saving..." : "Finish"}
        </button>
      </form>
    </main>
  );
}
