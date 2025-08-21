import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/dbConnect";
import User from "@/models/User";

export async function POST(req) {
  try {
    const { email, code } = await req.json();
    if (!email || !code) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const normEmail = String(email).trim().toLowerCase();
    const normCode = String(code).trim().replace(/\D/g, ""); // digits only

    await dbConnect();
    const user = await User.findOne({ email: normEmail })
      .select("+verifyCodeHash +verifyCodeExp"); // <- plus on BOTH

    if (!user?.verifyCodeHash || !user?.verifyCodeExp) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    if (user.verifyCodeExp.getTime() < Date.now()) {
      return NextResponse.json({ error: "Code expired" }, { status: 400 });
    }

    const ok = await bcrypt.compare(normCode, user.verifyCodeHash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    user.emailVerified = new Date();
    user.verifyCodeHash = undefined;
    user.verifyCodeExp = undefined;
    await user.save();

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("VERIFY_ERROR:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
