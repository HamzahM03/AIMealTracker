// app/onboarding/page.jsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { dbConnect } from "@/lib/dbConnect";
import User from "@/models/User";
import OnBoardingForm from "./OnBoardingForm";

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login?callbackUrl=/onboarding");

  await dbConnect();
  const u = await User.findById(session.user.id, "profileCompleted").lean();
  if (u?.profileCompleted) redirect("/plan");

  return <OnBoardingForm />;
}
