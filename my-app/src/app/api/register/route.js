import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/dbConnect";
import User from "@/models/User";

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

    const passwordHash = await bcrypt.hash(password, 12);
    await User.create({ name: name?.trim() || "", email: normalizedEmail, passwordHash });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    console.error("REGISTER_ERROR:", e?.message || e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
