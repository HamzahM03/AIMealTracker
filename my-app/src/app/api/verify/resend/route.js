// app/api/verify/resend/route.js
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/dbConnect";
import User from "@/models/User";
import { sendVerifyEmail } from "@/lib/mail";

const genCode = () => String(Math.floor(100000 + Math.random() * 900000));

export async function POST(req) {
  try {
    const { email } = await req.json();
    const normEmail = String(email || "").trim().toLowerCase();
    if (!normEmail) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findOne({ email: normEmail })
      .select("emailVerified verifyCodeHash verifyCodeExp verifyCodeSentAt");

    // To avoid account enumeration, you can return 200 even if user not found
    if (!user) return NextResponse.json({ ok: true });

    if (user.emailVerified) {
      return NextResponse.json({ error: "Already verified" }, { status: 400 });
    }

    const now = Date.now();
    const cooldownMs = 45 * 1000; // 45s cooldown between sends

    if (user.verifyCodeSentAt && now - user.verifyCodeSentAt.getTime() < cooldownMs) {
      const retryIn = Math.ceil((cooldownMs - (now - user.verifyCodeSentAt.getTime())) / 1000);
      return NextResponse.json({ error: "Please wait before resending", retryIn }, { status: 429 });
    }

    // Issue new code
    const code = genCode();
    user.verifyCodeHash = await bcrypt.hash(code, 10);
    user.verifyCodeExp = new Date(now + 10 * 60 * 1000); // 10 minutes valid
    user.verifyCodeSentAt = new Date(now);
    await user.save();

    // Send email (implement this to deliver code)
    await sendVerifyEmail(normEmail, code);

    if (process.env.NODE_ENV !== "production") {
      console.log("[VERIFY CODE - RESEND]", normEmail, code);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("RESEND_VERIFY_ERROR:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
