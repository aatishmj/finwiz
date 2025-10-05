"use client"

import type React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, EyeOff, Mail, Lock, User, Github, Twitter, TrendingUp } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"

interface AuthFormProps extends React.ComponentProps<"div"> {
  defaultTab?: "login" | "signup"
}

export function AuthForm({ className, defaultTab = "login", ...props }: AuthFormProps) {
  const { toast } = useToast()
  const { login, register } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [activeTab, setActiveTab] = useState(defaultTab)

  // Form states
  const [loginForm, setLoginForm] = useState({
    username: "",
    password: "",
    remember: false,
  })

  const [signupForm, setSignupForm] = useState({
    name: "",
    email: "",
    password: "",
    terms: false,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const togglePasswordVisibility = () => setShowPassword(!showPassword)

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setLoginForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setSignupForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Validate form
    if (!loginForm.username || !loginForm.password) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    try {
      await login(loginForm.username, loginForm.password)

      toast({
        title: "Success",
        description: "You have successfully logged in!",
      })

      // No need to redirect here as it's handled in the auth context
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Login failed. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Validate form
    if (!signupForm.name || !signupForm.email || !signupForm.password) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    if (!signupForm.terms) {
      toast({
        title: "Error",
        description: "You must agree to the Terms of Service",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    try {
      // Use name as username for registration
      await register(signupForm.name, signupForm.email, signupForm.password)

      toast({
        title: "Account created",
        description: "Your account has been successfully created!",
      })

      // No need to redirect here as it's handled in the auth context
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Registration failed. Please try again.",
        variant: "destructive",
      })
      setIsSubmitting(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden border-none shadow-lg">
        <CardContent className="grid p-0 md:grid-cols-2">
          <div className="relative hidden bg-gradient-to-br from-primary to-primary/70 md:block">
            <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-white">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="max-w-md space-y-4 text-center"
              >
                <div className="flex justify-center mb-4">
                  <TrendingUp className="h-12 w-12" />
                </div>
                <h1 className="text-4xl font-bold tracking-tight">StockSence</h1>
                <h2 className="text-3xl font-bold tracking-tight">
                  {activeTab === "login" ? "Welcome back" : "Join our community"}
                </h2>
                <p className="text-white/80">
                  {activeTab === "login"
                    ? "Sign in to access your account and continue your trading journey with StockSence."
                    : "Create an account to start trading and investing with StockSence's powerful platform."}
                </p>
              </motion.div>
            </div>
            <div className="absolute bottom-6 left-6 flex space-x-2">
              <div className="h-2 w-2 rounded-full bg-white/30"></div>
              <div className="h-2 w-2 rounded-full bg-white/60"></div>
              <div className="h-2 w-2 rounded-full bg-white"></div>
            </div>
          </div>

          <div className="p-6 md:p-8">
            <div className="flex items-center justify-center mb-6 md:hidden">
              <TrendingUp className="h-8 w-8 text-primary mr-2" />
              <h1 className="text-2xl font-bold">StockSence</h1>
            </div>

            <Tabs defaultValue="login" value={activeTab} onValueChange={(value) => setActiveTab(value as "login" | "signup")} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="login" onClick={() => window.history.pushState(null, "", "/auth")}>
                  Login
                </TabsTrigger>
                <TabsTrigger value="signup" onClick={() => window.history.pushState(null, "", "/signup")}>
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <AnimatePresence mode="wait">
                <>
                  <TabsContent value="login" className="mt-0">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <form className="space-y-4" onSubmit={handleLoginSubmit}>
                        <div className="space-y-2">
                          <Label htmlFor="username" className="text-sm font-medium">
                            Username
                          </Label>
                          <div className="relative">
                            <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                            <Input
                              id="username"
                              name="username"
                              type="text"
                              placeholder="johndoe"
                              className="pl-10"
                              required
                              value={loginForm.username}
                              onChange={handleLoginChange}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="password" className="text-sm font-medium">
                              Password
                            </Label>
                            <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                              Forgot password?
                            </Button>
                          </div>
                          <div className="relative">
                            <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                            <Input
                              id="password"
                              name="password"
                              type={showPassword ? "text" : "password"}
                              className="pl-10 pr-10"
                              required
                              value={loginForm.password}
                              onChange={handleLoginChange}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={togglePasswordVisibility}
                            >
                              {showPassword ? (
                                <EyeOff className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <Eye className="h-5 w-5 text-muted-foreground" />
                              )}
                              <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="remember"
                            name="remember"
                            checked={loginForm.remember}
                            onCheckedChange={(checked) =>
                              setLoginForm((prev) => ({ ...prev, remember: checked === true }))
                            }
                          />
                          <label
                            htmlFor="remember"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Remember me
                          </label>
                        </div>

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                          {isSubmitting ? "Signing in..." : "Sign in"}
                        </Button>

                        <div className="relative text-center text-xs text-muted-foreground before:absolute before:inset-0 before:top-1/2 before:h-px before:bg-border after:absolute after:inset-0 after:top-1/2 after:h-px after:bg-border">
                          <span className="relative z-10 bg-background px-2">or continue with</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <Button variant="outline" className="w-full" type="button">
                            <Github className="mr-2 h-4 w-4" />
                            GitHub
                          </Button>
                          <Button variant="outline" className="w-full" type="button">
                            <Twitter className="mr-2 h-4 w-4" />
                            Twitter
                          </Button>
                        </div>
                        <div className="text-center text-sm mt-4">
                          Don&apos;t have an account?{" "}
                          <a href="/signup" className="text-primary underline underline-offset-4">
                            Sign up
                          </a>
                        </div>
                      </form>
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="signup" className="mt-0">
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <form className="space-y-4" onSubmit={handleSignupSubmit}>
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-sm font-medium">
                            Full Name
                          </Label>
                          <div className="relative">
                            <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                            <Input
                              id="name"
                              name="name"
                              type="text"
                              placeholder="John Doe"
                              className="pl-10"
                              required
                              value={signupForm.name}
                              onChange={handleSignupChange}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="signup-email" className="text-sm font-medium">
                            Email
                          </Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                            <Input
                              id="signup-email"
                              name="email"
                              type="email"
                              placeholder="name@example.com"
                              className="pl-10"
                              required
                              value={signupForm.email}
                              onChange={handleSignupChange}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="signup-password" className="text-sm font-medium">
                            Password
                          </Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                            <Input
                              id="signup-password"
                              name="password"
                              type={showPassword ? "text" : "password"}
                              className="pl-10 pr-10"
                              required
                              value={signupForm.password}
                              onChange={handleSignupChange}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={togglePasswordVisibility}
                            >
                              {showPassword ? (
                                <EyeOff className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <Eye className="h-5 w-5 text-muted-foreground" />
                              )}
                              <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="terms"
                            name="terms"
                            required
                            checked={signupForm.terms}
                            onCheckedChange={(checked) => setSignupForm((prev) => ({ ...prev, terms: checked === true }))}
                          />
                          <label
                            htmlFor="terms"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            I agree to the{" "}
                            <a href="#" className="text-primary underline underline-offset-4">
                              Terms of Service
                            </a>{" "}
                            and{" "}
                            <a href="#" className="text-primary underline underline-offset-4">
                              Privacy Policy
                            </a>
                          </label>
                        </div>

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                          {isSubmitting ? "Creating Account..." : "Create Account"}
                        </Button>

                        <div className="relative text-center text-xs text-muted-foreground before:absolute before:inset-0 before:top-1/2 before:h-px before:bg-border after:absolute after:inset-0 after:top-1/2 after:h-px after:bg-border">
                          <span className="relative z-10 bg-background px-2">or sign up with</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <Button variant="outline" className="w-full" type="button">
                            <Github className="mr-2 h-4 w-4" />
                            GitHub
                          </Button>
                          <Button variant="outline" className="w-full" type="button">
                            <Twitter className="mr-2 h-4 w-4" />
                            Twitter
                          </Button>
                        </div>
                        <div className="text-center text-sm mt-4">
                          Already have an account?{" "}
                          <a href="/auth" className="text-primary underline underline-offset-4">
                            Log in
                          </a>
                        </div>
                      </form>
                    </motion.div>
                  </TabsContent>
                </>
              </AnimatePresence>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      <div className="text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} StockSence. All rights reserved.
      </div>
    </div>
  )
}
