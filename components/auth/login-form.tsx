'use client'

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from "@/components/ui/alert-dialog"
import ChromeIcon from "@/components/icons/chrome"
import { GithubIcon } from "@/components/icons/github"
import { FingerprintIcon } from "@/components/icons/fingerprint"
import Image from "next/image"
import { toast } from "sonner"

export function LoginForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const [email, setEmail] = useState("")
    const [showMagicLinkDialog, setShowMagicLinkDialog] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)
        
        try {
            const response = await fetch("/api/auth/magic-link", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            })

            if (!response.ok) {
                throw new Error("Failed to send magic link")
            }

            setShowMagicLinkDialog(true)
            toast.success("Magic link sent to your email!", {
                position: "top-center",
            })
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Failed to send magic link. Please try again."
            toast.error(errorMessage, {
                position: "top-center",
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleSocialSignIn = async (provider: "github" | "google") => {
        setIsLoading(true)
        try {
            if (provider === "google") {
                window.location.href = "/api/auth/google"
            } else if (provider === "github") {
                window.location.href = "/api/auth/github"
            }
        } finally {
            setIsLoading(false)
        }
    }

    const resetForm = () => {
        setEmail("")
        setShowMagicLinkDialog(false)
    }

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card className="overflow-hidden">
                <CardContent className="grid p-0 md:grid-cols-2">
                    <form className="p-6 md:p-8" onSubmit={handleEmailSubmit}>
                        <div className="flex flex-col gap-6">
                            <div className="flex flex-col items-center text-center">
                                <h1 className="text-2xl font-bold">Welcome</h1>
                                <p className="text-balance text-muted-foreground">
                                    Enter your email to continue to Events Palour
                                </p>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="m@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isLoading}
                                    required
                                    
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? "Sending..." : "Continue with Email"}
                            </Button>
                            <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                                <span className="relative z-10 bg-background px-2 text-muted-foreground">
                                    Or continue with
                                </span>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button 
                                                variant="outline" 
                                                className="w-full p-0"
                                                onClick={() => handleSocialSignIn("github")}
                                                disabled={isLoading}
                                            >
                                                <GithubIcon />
                                                <span className="sr-only">GitHub</span>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent className="hidden lg:block">
                                            GitHub
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button 
                                                variant="outline" 
                                                className="w-full p-0"
                                                onClick={() => handleSocialSignIn("google")}
                                                disabled={isLoading}
                                            >
                                                <ChromeIcon />
                                                <span className="sr-only">Google</span>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent className="hidden lg:block">
                                            Google
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button 
                                                variant="outline" 
                                                className="w-full p-0"
                                                disabled={isLoading}
                                                onClick={() => toast.success("Demo: Would sign in with Passkey")}
                                            >
                                                <FingerprintIcon />
                                                <span className="sr-only">Passkeys</span>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent className="hidden lg:block">
                                            Passkeys
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        </div>
                    </form>
                    <div className="relative hidden bg-muted md:block">
                        <Image
                            src="/images/login.svg"
                            alt="auth illustration"
                            fill
                            priority
                            className="object-cover dark:brightness-[0.2] dark:grayscale"
                        />
                    </div>
                </CardContent>
            </Card>

            <AlertDialog 
                open={showMagicLinkDialog} 
                onOpenChange={(open) => {
                    setShowMagicLinkDialog(open)
                    if (!open) resetForm()
                }}
            >
                <AlertDialogContent className="flex max-w-md flex-col items-center gap-6 px-6 py-4 text-center sm:gap-8 sm:p-8">
                    <AlertDialogHeader className="gap-4">
                        <AlertDialogTitle className="text-2xl font-bold">
                            Check Your Email
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-3 text-base text-muted-foreground">
                            <p>
                                We&apos;ve sent a magic link to{" "}
                                <span className="font-medium text-foreground">{email}</span>
                            </p>
                            <p>
                                Click the link in the email to sign in to your account. 
                                The link will expire in 10 minutes.
                            </p>
                            <p className="text-sm">
                                If you don&apos;t see the email, check your spam folder.
                            </p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-center">
                        <AlertDialogCancel 
                            className="w-full sm:w-32"
                            onClick={resetForm}
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className="w-full sm:w-auto sm:min-w-32"
                            onClick={() => {
                                toast.success("New magic link sent!", {
                                    position: "top-center",
                                })
                                const syntheticEvent = Object.create(new Event('submit'), {
                                    target: { value: document.createElement('form') },
                                    preventDefault: { value: () => {} }
                                })
                                handleEmailSubmit(syntheticEvent as React.FormEvent<HTMLFormElement>)
                            }}
                        >
                            Resend Email
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
                By clicking continue, you agree to our <a href="/terms">Terms of Service</a>{" "}
                and <a href="/privacy-policy">Privacy Policy</a>.
            </div>
        </div>
    )
}

export default LoginForm