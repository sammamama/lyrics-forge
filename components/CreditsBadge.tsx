"use client";

import { useEffect, useState } from "react";

export function CreditsBadge() {
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/credits")
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && typeof json?.data?.balance === "number") {
          setBalance(json.data.balance);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <span className="credits-badge">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden>
        <path d="M5 0l1.2 3.8L10 5 6.2 6.2 5 10 3.8 6.2 0 5l3.8-1.2L5 0z" />
      </svg>
      {balance === null ? "— credits" : `${balance} credit${balance === 1 ? "" : "s"}`}
    </span>
  );
}
