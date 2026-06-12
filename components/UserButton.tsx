"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CreditsBadge } from "@/components/CreditsBadge";
import { signOut, useSession } from "@/lib/auth-client";

// Avatar button (account image, generic icon fallback) that expands a
// collapsible account box right underneath: credits balance + settings.
// `children` renders next to the avatar in the trigger row (e.g. New song).
export function UserButton({ children }: { children?: React.ReactNode }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const user = session?.user;

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      router.push("/sign-in");
    } catch {
      setSigningOut(false);
    }
  }

  return (
    <Collapsible className="w-full">
      <div className="flex items-center gap-2">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="shrink-0 cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Account and settings"
          >
            <Avatar className="size-9 border border-border">
              <AvatarImage
                src={user?.image ?? undefined}
                alt={user?.name ?? "User"}
              />
              <AvatarFallback>
                <UserIcon className="size-4 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
          </button>
        </CollapsibleTrigger>
        {children}
      </div>

      <CollapsibleContent>
        <div className="mt-2 flex flex-col gap-3 rounded-lg border border-border bg-surface p-3">
          <div className="flex items-center gap-3">
            <Avatar className="size-10 border border-border">
              <AvatarImage
                src={user?.image ?? undefined}
                alt={user?.name ?? "User"}
              />
              <AvatarFallback>
                <UserIcon className="size-4 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user?.name ?? "—"}</p>
              <p className="truncate text-xs text-muted-foreground">
                {user?.email ?? ""}
              </p>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <CreditsBadge />
            <Button asChild variant="outline" size="xs">
              <Link href="/dashboard/credits">Buy credits</Link>
            </Button>
          </div>

          <Separator />

          <Button
            variant="destructive"
            size="sm"
            className="w-full"
            disabled={signingOut}
            onClick={handleSignOut}
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
