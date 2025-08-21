// app/api/auth/register/route.js
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/dbConnect";
import User from "@/models/User";
import { sendVerifyEmail } from "@/lib/mail";

const genCode = () => String(Math.floor(100000 + Math.random() * 900000)); // 6-digit

export async function POST(req) {
  try {
    const { name, email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    await dbConnect();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    // Create user
    const passwordHash = await bcrypt.hash(password, 12);
    await User.create({
      name: name?.trim() || "",
      email: normalizedEmail,
      passwordHash,
      emailVerified: null,
    });

    // Issue first code
    const code = genCode();
    const codeHash = await bcrypt.hash(code, 12);
    const now = Date.now();

    await User.updateOne(
      { email: normalizedEmail },
      {
        $set: {
          verifyCodeHash: codeHash,
          verifyCodeExp: new Date(now + 15 * 60 * 1000), // 15 min valid
          verifyCodeSentAt: new Date(now),                // track send time
        },
      }
    );

    // Send email (implement sendVerifyEmail to actually deliver)
    await sendVerifyEmail(normalizedEmail, code);

    if (process.env.NODE_ENV !== "production") {
      console.log("[VERIFY CODE - SIGNUP]", normalizedEmail, code);
    }

    // Tell client to go to /verify
    return NextResponse.json({ ok: true, needsVerification: true }, { status: 201 });
  } catch (e) {
    console.error("REGISTER_ERROR:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
