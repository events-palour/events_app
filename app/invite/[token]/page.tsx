'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { use } from 'react';

export default function InviteAcceptancePage({ params }: { params: Promise<{ token: string }> }) {
  const [isLoading, setIsLoading] = useState(true);
  const [organizationName, setOrganizationName] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const router = useRouter();
  
  
  const { token } = use(params);

  useEffect(() => {
    async function validateInvite() {
      try {
        const response = await fetch(`/api/organizations/invites/${token}/validate`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error);
        }
        
        setOrganizationName(data.organizationName);
        setOrganizationId(data.organizationId);
        setIsLoading(false);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Invalid Invite",
          description: error instanceof Error ? error.message : "This invite is invalid or has expired",
        });
        router.push('/');
      }
    }
    validateInvite();
  }, [token, router]);

  const acceptInvite = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/organizations/${organizationId}/invites/${token}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      toast({
        title: "Welcome aboard!",
        description: `You've successfully joined ${organizationName}`,
      });

      router.push('/dashboard/organizer');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to accept invite",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container max-w-md mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Join Organization</CardTitle>
        </CardHeader>
        <CardContent>
          <p>You&apos;ve been invited to join {organizationName}</p>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={acceptInvite}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Joining...
              </>
            ) : (
              'Accept Invitation'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}