import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { DynamicBreadcrumbs } from "./components/breadcrumbs"

const navigationItems = [
  {
    title: "Dashboard",
    url: "/dashboard/attendee"
  },
  {
    title: "Events",
    url: "/dashboard/attendee/events"
  },
  {
    title: "Tickets",
    url: "/dashboard/attendee/tickets"
  },
  {
    title: "Analytics",
    url: "/dashboard/attendee/analytics"
  },
  {
    title: "Settings",
    url: "/dashboard/attendee/settings"
  },
  {
    title: "Help and Support",
    url: "/dashboard/attendee/support"
  },
]

export default function AttendeeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <DynamicBreadcrumbs items={navigationItems} />
          </div>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}