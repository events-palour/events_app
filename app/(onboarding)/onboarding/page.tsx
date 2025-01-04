import  OnboardingPage  from "@/components/onboarding/onboarding-form"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Onboarding| Events Palour",
  description: "Lets get you Onboarded with Events Palour. ",
}

export default async function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        <OnboardingPage />
      </div>
    </div>
  )
}