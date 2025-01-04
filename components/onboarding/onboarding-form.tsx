'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ImagePlus, Users, Building2, Loader2, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ImageUpload } from "@/components/image-Upload";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { organizationSchema } from "@/lib/server/organization";

const steps = [
  {
    id: 1,
    title: "Organization Details",
    icon: Building2,
    description: "Set up your event organization profile"
  },
  {
    id: 2,
    title: "Branding",
    icon: ImagePlus,
    description: "Upload your organization's logo"
  },
  {
    id: 3,
    title: "Team Setup",
    icon: Users,
    description: "Invite team members to collaborate"
  }
];

interface Invite {
  email: string;
  role: 'MEMBER' | 'ADMIN';
}

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [invites, setInvites] = useState<Invite[]>([]);
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      orgName: "",
      description: "",
      website: "",
      logo: null,
    },
  });

  const { formState: { errors } } = form;

  const currentStep = steps.find(s => s.id === step);
  const totalSteps = steps.length;

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleInvite = async (email: string) => {
    if (!email) return;

    if (!validateEmail(email)) {
      toast({
        variant: "destructive",
        title: "Invalid email",
        description: "Please enter a valid email address",
      });
      return;
    }

    if (invites.some(invite => invite.email === email)) {
      toast({
        variant: "destructive",
        title: "Duplicate email",
        description: "This email has already been invited",
      });
      return;
    }

    setInvites([...invites, { email, role: "MEMBER" }]);
    toast({
      title: "Invite added",
      description: `${email} will be invited when you complete the setup`,
    });
  };

  const removeInvite = (email: string): void => {
    setInvites(invites.filter(invite => invite.email !== email));
    toast({
      title: "Invite removed",
      description: `Removed ${email} from invites`,
    });
  };

  const handleNext = async () => {
    const fieldsToValidate = getFieldsForStep(step);
    const isValid = await form.trigger(fieldsToValidate);

    if (isValid) {
      if (step === totalSteps) {
        await handleSubmit();
      } else {
        setStep(step + 1);
      }
    }
  };

  const getFieldsForStep = (currentStep: number): ("orgName" | "description" | "website" | "logo")[] => {
    switch (currentStep) {
      case 1:
        return ['orgName', 'description', 'website'];
      case 2:
        return ['logo'];
      default:
        return [];
    }
  };

  const sendInvites = async (orgId: string) => {
    try {
      await Promise.all(
        invites.map(async (invite) => {
          const response = await fetch(`/api/organizations/${orgId}/invites`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(invite),
          });

          if (!response.ok) {
            throw new Error(`Failed to send invite to ${invite.email}`);
          }
        })
      );

      toast({
        title: "Invites sent",
        description: `Successfully sent invites to ${invites.length} team member${invites.length === 1 ? '' : 's'}`,
      });
    } catch (error) {
      console.error('Error sending invites:', error);
      toast({
        variant: "destructive",
        title: "Error sending invites",
        description: error instanceof Error ? error.message : "Failed to send invites",
      });
    }
  };

  // In your onboarding form component
const handleSubmit = async () => {
  try {
    setIsLoading(true);
    const formData = form.getValues();
    
    // Create organization
    const orgResponse = await fetch('/api/organizations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    
    if (!orgResponse.ok) {
      throw new Error(await orgResponse.text());
    }
    
    const organization = await orgResponse.json();

    // Send invites if there are any
    if (invites.length > 0) {
      await sendInvites(organization.id);
    }

    toast({
      title: "Organization created!",
      description: `${organization.name} has been created. Redirecting to your dashboard...`,
    });

    // Redirect to dashboard after short delay
    setTimeout(() => {
      router.push('/dashboard/organizer');
    }, 1500);

  } catch (error) {
    console.error('Submission error:', error);
    toast({
      variant: "destructive",
      title: "Error",
      description: error instanceof Error ? error.message : "Failed to create organization",
    });
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="container max-w-3xl mx-auto py-10">
      <Progress 
        value={(step / totalSteps) * 100} 
        className="mb-8 h-2"
      />

      <Card className="w-full">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            {currentStep?.icon && (
              <currentStep.icon className="h-5 w-5 text-muted-foreground" />
            )}
            <CardTitle className="text-2xl font-bold">
              {currentStep?.title}
            </CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            {currentStep?.description}
          </p>
        </CardHeader>

        <Form {...form}>
          <form onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
            <CardContent className="space-y-4">
              {step === 1 && (
                <>
                  <FormField
                    control={form.control}
                    name="orgName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Events Palour Organization"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell us about your organization and the events you organize"
                            className="min-h-28"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://your-events-website.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {step === 2 && (
                <FormField
                  control={form.control}
                  name="logo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Logo</FormLabel>
                      <FormControl>
                        <ImageUpload
                          value={field.value}
                          onChange={field.onChange}
                          error={errors.logo?.message}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <FormLabel>Invite Team Members</FormLabel>
                    <div className="flex space-x-2">
                      <Input
                        id="inviteEmail"
                        type="email"
                        placeholder="team@organization.com"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const input = e.currentTarget;
                            handleInvite(input.value);
                            input.value = '';
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          const input = document.getElementById('inviteEmail') as HTMLInputElement;
                          if (input) {
                            handleInvite(input.value);
                            input.value = '';
                          }
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  </div>

                  {invites.length > 0 && (
                    <div className="space-y-2">
                      {invites.map((invite, index) => (
                        <Alert key={index} className="flex justify-between items-center">
                          <AlertDescription>{invite.email}</AlertDescription>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeInvite(invite.email)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </Alert>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>

            <CardFooter className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(Math.max(1, step - 1))}
                disabled={step === 1 || isLoading}
              >
                Previous
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="min-w-30"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {step === totalSteps ? 'Creating...' : 'Saving...'}
                  </>
                ) : (
                  step === totalSteps ? 'Complete Setup' : 'Next Step'
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}