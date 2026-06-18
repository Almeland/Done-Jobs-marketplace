"use client";

import { useEffect } from "react";
import { registrerVisning } from "@/app/actions/tracking";

export default function ViewTracker({ listingId }: { listingId: string }) {
  useEffect(() => {
    registrerVisning(listingId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
