// app/api/auth/lookup/route.js
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/dbConnect";
import User from "@/models/User";

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    const normEmail = String(email || "").trim().toLowerCase();
    const pass = String(password || "");

    if (!normEmail || !pass) {
      // Don’t leak anything
      return NextResponse.json({ unverified: false }, { status: 200 });
    }

    await dbConnect();
    const user = await User.findOne({ email: normEmail })
      .select("+passwordHash emailVerified")
      .lean();

    // Uniform response shape to avoid account enumeration
    if (!user?.passwordHash) {
      return NextResponse.json({ unverified: false }, { status: 200 });
    }

    const ok = await bcrypt.compare(pass, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ unverified: false }, { status: 200 });
    }

    // Only reveal unverified when the password is correct
    return NextResponse.json({ unverified: !user.emailVerified }, { status: 200 });
  } catch (e) {
    console.error("[LOOKUP] error", e);
    return NextResponse.json({ unverified: false }, { status: 200 });
  }
}
