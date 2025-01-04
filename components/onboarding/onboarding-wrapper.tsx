'use client'
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getCurrentSession } from '@/lib/server/session';
import { prisma } from '@/lib/server/db';

interface WithOrgAuthProps {
    children: React.ReactNode;
    adminOnly?: boolean;
}

export async function getCurrentUserRole(organizationId: string) {
    const session = await getCurrentSession();
    if (!session.user) return null;

    const member = await prisma.organizationMember.findUnique({
        where: {
            organizationId_userId: {
                organizationId,
                userId: session.user.id,
            },
        },
    });

    return member?.role || null;
}

export function WithOrgAuth({ children, adminOnly = false }: WithOrgAuthProps) {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const pathParts = window.location.pathname.split('/');
                const orgId = pathParts[pathParts.indexOf('organizations') + 1];

                if (!orgId) {
                    router.push('/dashboard/organizer');
                    return;
                }

                const role = await getCurrentUserRole(orgId);

                if (!role) {
                    router.push('/dashboard/organizer');
                    return;
                }

                if (adminOnly && role !== 'ADMIN') {
                    router.push('/dashboard/organizer');
                    return;
                }

                setIsAuthorized(true);
            } catch (error) {
                console.error('Auth check failed:', error);
                router.push('/dashboard/organizer');
            }
        };

        checkAuth();
    }, [router, adminOnly]);

    return isAuthorized ? children : null;
}

// usage 

// In admin-only pages:
// export default function AdminPage() {
//     return (
//       <WithOrgAuth adminOnly>
//         {/* Admin content */}
//       </WithOrgAuth>
//     );
//   }
  
  // In member-accessible pages:
//   export default function MemberPage() {
//     return (
//       <WithOrgAuth>
//         {/* Member content */}
//       </WithOrgAuth>
//     );
//   }