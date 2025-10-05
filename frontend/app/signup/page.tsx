import { AuthForm } from "@/components/auth-form"
import { ThemeToggle } from "@/components/theme-toggle"

export default function SignupPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4 md:p-8">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm md:max-w-3xl">
        <AuthForm defaultTab="signup" />
      </div>
    </div>
  )
}
