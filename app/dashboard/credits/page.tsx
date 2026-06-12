import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getBalance } from "@/lib/credits";

// Placeholder until the Stripe checkout phase — shows the live balance so the
// nav link doesn't 404.
export default async function CreditsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/sign-in");
  }

  const balance = await getBalance(session.user.id);

  return (
    <div className="dash-page">
      <h1 className="font-semibold" style={{ fontSize: "var(--text-h1)" }}>
        Credits
      </h1>
      <div className="card">
        <p className="text-muted-foreground" style={{ fontSize: "var(--text-body)" }}>
          You have{" "}
          <span className="text-primary font-medium">{balance}</span> credit
          {balance === 1 ? "" : "s"}. Credit packs are coming soon.
        </p>
      </div>
    </div>
  );
}
