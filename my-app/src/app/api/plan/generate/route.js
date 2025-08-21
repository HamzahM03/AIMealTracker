// app/api/plan/generate/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { dbConnect } from "@/lib/dbConnect";
import User from "@/models/User";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();
    const user = await User.findById(
      session.user.id,
      "profileCompleted goal preferences"
    ).lean();

    if (!user?.profileCompleted) {
      return NextResponse.json({ error: "Onboarding incomplete" }, { status: 400 });
    }

    const { period, mealsPerDay } = await req.json();

    // TODO: your real generation logic here — stubbed:
    const plan = {
      period: period ?? "week",
      days: [
        { day: "Mon", meals: [{ name: "Example", macros: { kcal: 500, protein: 30, carb: 50, fat: 15 }, ingredients: [] }] },
      ],
    };

    return NextResponse.json({ plan });
  } catch (e) {
    console.error("PLAN_GENERATE_ERROR:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
