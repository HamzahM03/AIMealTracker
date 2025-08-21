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
        if (!creds?.email || !creds?.password) return null;
        await dbConnect();
        const email = creds.email.trim().toLowerCase();
        const user = await User.findOne({ email }).select("+passwordHash");
        if (!user) return null;
        const ok = await bcrypt.compare(creds.password, user.passwordHash);
        if (!ok) return null;
        return { id: String(user._id), email: user.email, name: user.name || user.email };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.uid = user.id;
      return token;
    },
    async session({ session, token }) {
      if (!session.user) session.user = {};
      if (token?.uid) session.user.id = token.uid;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
