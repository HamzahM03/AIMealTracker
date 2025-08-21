// app/api/plan/generate/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { dbConnect } from "@/lib/dbConnect";
import User from "@/models/User";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";


const SAMPLE_MEALS = [
  { name: "Chicken & Rice", macros:{kcal:520,protein:40,carb:60,fat:12}, ingredients:["chicken","rice","broccoli"] },
  { name: "Oats & Berries", macros:{kcal:380,protein:15,carb:60,fat:8}, ingredients:["oats","berries","milk"] },
  { name: "Greek Yogurt Bowl", macros:{kcal:300,protein:25,carb:30,fat:7}, ingredients:["yogurt","honey","granola"] },
  { name: "Tuna Wrap", macros:{kcal:430,protein:35,carb:45,fat:12}, ingredients:["tuna","tortilla","lettuce"] },
  { name: "Tofu Stir Fry", macros:{kcal:450,protein:28,carb:50,fat:14}, ingredients:["tofu","rice","veg mix"] },
];

const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { period = "day", mealsPerDay = 2 } = await req.json();
    if (!["day","week"].includes(period) || ![2,3].includes(mealsPerDay)) {
      return NextResponse.json({ error: "Invalid params" }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user?.profileCompleted) {
      return NextResponse.json({ error: "Complete onboarding first" }, { status: 400 });
    }

    // very dumb filter to honor exclusions a bit
    const excludes = new Set(user?.preferences?.exclusions || []);
    const filtered = SAMPLE_MEALS.filter(m =>
      !m.ingredients.some(ing => excludes.has(ing.toLowerCase()))
    );
    const pool = filtered.length ? filtered : SAMPLE_MEALS;

    // build days
    const numDays = period === "day" ? 1 : 7;
    const days = Array.from({ length: numDays }, (_, i) => {
      const dayName = period === "day" ? "Today" : DAYS[i];
      const meals = Array.from({ length: mealsPerDay }, (_, j) => {
        const pick = pool[(i*mealsPerDay + j) % pool.length];
        return { ...pick };
      });
      return { day: dayName, meals };
    });

    const plan = {
      period,
      startDate: new Date(),
      mealsPerDay,
      days,
      toBuy: [], // keeping it simple for now
      seed: Math.floor(Math.random()*1e9),
    };

    return NextResponse.json({ ok: true, plan });
  } catch (e) {
    console.error("PLAN_GENERATE_ERROR:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
