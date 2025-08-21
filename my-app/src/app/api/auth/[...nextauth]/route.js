// app/api/auth/[...nextauth]/route.js
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { dbConnect } from "@/lib/dbConnect";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export const authOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/auth/login" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: { email: {}, password: {} },
      async authorize(creds) {
        try {
          if (!creds?.email || !creds?.password) return null;

          await dbConnect();
          const email = creds.email.trim().toLowerCase();

          const user = await User.findOne({ email }).select("+passwordHash emailVerified");
          console.log("[LOGIN] user?", !!user, "hasHash?", !!user?.passwordHash, "verified?", !!user?.emailVerified);

          if (!user?.passwordHash) return null;

          const ok = await bcrypt.compare(String(creds.password), String(user.passwordHash));
          if (!ok) return null;

          if (!user.emailVerified) {
            const err = new Error("EMAIL_NOT_VERIFIED");
            err.name = "CredentialsSignin";
            throw err;
          }

          return { id: String(user._id), email: user.email, name: user.name || user.email };
        } catch (e) {
          console.error("[LOGIN authorize] error:", e);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.email = user.email;
        token.name = user.name ?? user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (!session.user) session.user = {};
      if (token?.uid)   session.user.id = token.uid;
      if (token?.email) session.user.email = token.email;
      if (token?.name)  session.user.name = token.name;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
