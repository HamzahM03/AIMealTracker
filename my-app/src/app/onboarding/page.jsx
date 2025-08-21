import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { dbConnect } from "@/lib/dbConnect";
import User from "@/models/User";
import OnBoardingForm from "./OnBoardingForm"; // client component

export default async function OnboardingPage() {
  const session = await getServerSession();
  if (!session) redirect("/auth/login?callbackUrl=/onboarding"); // not logged in → login

  await dbConnect();
  const u = await User.findOne({ email: session.user.email }, "profileCompleted").lean();
  if (u?.profileCompleted) redirect("/plan"); // already done → dashboard

  return <OnBoardingForm />; // your existing single-page form
}
