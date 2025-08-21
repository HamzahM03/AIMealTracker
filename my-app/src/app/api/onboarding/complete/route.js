// app/api/onboarding/complete/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { dbConnect } from "@/lib/dbConnect";
import User from "@/models/User";

export async function POST(req) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { goal, height, weight, preferences } = await req.json();

    const validTargets = ["lose_weight","maintain","gain"];
    const validAL = ["sedentary","light","moderate","active"];
    if (!goal || !validTargets.includes(goal.target) || (goal.activityLevel && !validAL.includes(goal.activityLevel))) {
      return NextResponse.json({ error: "Invalid goal" }, { status: 400 });
    }
    if (!height?.value || !weight?.value) {
      return NextResponse.json({ error: "Missing height/weight" }, { status: 400 });
    }

    await dbConnect();
    await User.updateOne(
      { email: session.user.email },
      { $set: {
          goal: { target: goal.target, activityLevel: goal.activityLevel || "light", calories: goal.calories ?? null },
          height: { value: Number(height.value), unit: height.unit || "cm" },
          weight: { value: Number(weight.value), unit: weight.unit || "kg" },
          preferences: {
            exclusions: Array.isArray(preferences?.exclusions)
              ? preferences.exclusions.map(s => String(s).trim()).filter(Boolean)
              : [],
            unitsPref: preferences?.unitsPref === "imperial" ? "imperial" : "metric"
          },
          onboardingStep: "done",
          profileCompleted: true
        } }
    );

    return NextResponse.json({ ok: true, profileCompleted: true });
  } catch (e) {
    console.error("ONBOARDING_COMPLETE_ERROR:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
