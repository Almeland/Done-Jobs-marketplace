"use client";

import { useTransition, useState } from "react";
import { followCompanyAsSeeker, unfollowCompanyAsSeeker } from "@/app/actions/alerts";
import { useRouter } from "next/navigation";

type Props = {
  accountId: string;
  companyName: string;
  isFollowing: boolean;
  isLoggedIn: boolean;
};

export default function FolgKnapp({ accountId, isFollowing: initialFollowing, isLoggedIn }: Props) {
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function toggle() {
    if (!isLoggedIn) {
      router.push("/jobbsoker/logg-inn");
      return;
    }
    startTransition(async () => {
      if (following) {
        await unfollowCompanyAsSeeker(accountId);
        setFollowing(false);
      } else {
        await followCompanyAsSeeker(accountId);
        setFollowing(true);
      }
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className={`text-sm font-medium rounded-full px-4 py-2 transition-colors whitespace-nowrap disabled:opacity-50 ${
        following
          ? "bg-lavender text-violet hover:bg-red-brand/10 hover:text-red-brand"
          : "border border-platinum text-midnight/60 hover:border-violet hover:text-violet"
      }`}
    >
      {pending ? "…" : following ? "Følger ✓" : "+ Følg"}
    </button>
  );
}
