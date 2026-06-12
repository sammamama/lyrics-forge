"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, AudioLines, Coins } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { CreditsBadge } from "@/components/CreditsBadge";

const LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid, exact: true },
  { href: "/dashboard/generate", label: "Generate", icon: AudioLines },
  { href: "/dashboard/credits", label: "Credits", icon: Coins },
];

function isActive(pathname: string, link: (typeof LINKS)[number]): boolean {
  return link.exact ? pathname === link.href : pathname.startsWith(link.href);
}

function MobileTabs() {
  const pathname = usePathname();
  return (
    <div className="dash-tabs">
      <nav className="dash-tabs-nav" aria-label="Dashboard">
        {LINKS.map((link) => {
          const Icon = link.icon;
          const active = isActive(pathname, link);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`dash-nav-item${active ? " active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={18} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // The generate workspace owns its own (history) sidebar — render full-bleed.
  if (pathname.startsWith("/dashboard/generate")) {
    return (
      <>
        {children}
        <MobileTabs />
      </>
    );
  }

  return (
    <SidebarProvider
      style={{ "--sidebar-width": "240px" } as React.CSSProperties}
    >
      <Sidebar collapsible="none" className="dash-nav-sidebar">
        <SidebarHeader className="px-4 pt-5">
          <Link href="/dashboard" className="dash-logo">
            Lyric<span className="text-primary">Forge</span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              {LINKS.map((link) => {
                const Icon = link.icon;
                return (
                  <SidebarMenuItem key={link.href}>
                    <SidebarMenuButton asChild isActive={isActive(pathname, link)}>
                      <Link href={link.href}>
                        <Icon />
                        <span>{link.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="px-4 pb-5">
          <div>
            <CreditsBadge />
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="pb-[72px] md:pb-0">{children}</SidebarInset>
      <MobileTabs />
    </SidebarProvider>
  );
}
