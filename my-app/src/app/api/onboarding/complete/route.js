// app/api/onboarding/complete/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { dbConnect } from "@/lib/dbConnect";
import User from "@/models/User";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    console.log("[ONBOARDING] session.user", session.user); // debug once

    const { goal, height, weight, preferences } = await req.json();

    const validTargets = ["lose_weight", "maintain", "gain"];
    const validAL = ["sedentary", "light", "moderate", "active"];

    if (!goal || !validTargets.includes(goal.target) ||
        (goal.activityLevel && !validAL.includes(goal.activityLevel))) {
      return NextResponse.json({ error: "Invalid goal" }, { status: 400 });
    }
    if (!height?.value || !weight?.value) {
      return NextResponse.json({ error: "Missing height/weight" }, { status: 400 });
    }

    await dbConnect();

    const result = await User.updateOne(
      { _id: session.user.id }, // ✅ use id, not email
      {
        $set: {
          goal: {
            target: goal.target,
            activityLevel: goal.activityLevel || "light",
            calories: goal.calories ?? null,
          },
          height: { value: Number(height.value), unit: height.unit || "cm" },
          weight: { value: Number(weight.value), unit: weight.unit || "kg" },
          preferences: {
            exclusions: Array.isArray(preferences?.exclusions)
              ? preferences.exclusions.map((s) => String(s).trim()).filter(Boolean)
              : [],
            unitsPref: preferences?.unitsPref === "imperial" ? "imperial" : "metric",
          },
          onboardingStep: "done",
          profileCompleted: true,
        },
      }
    );

    console.log("[ONBOARDING] updateOne:", result);

    // Read back by id to confirm
    const updated = await User.findById(session.user.id, "profileCompleted onboardingStep").lean();
    return NextResponse.json({
      ok: true,
      profileCompleted: !!updated?.profileCompleted,
      onboardingStep: updated?.onboardingStep,
    });
  } catch (e) {
    console.error("ONBOARDING_COMPLETE_ERROR:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
