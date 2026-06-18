"use client";

import { useRouter } from "next/navigation";

export default function LoggUtKnapp() {
  const router = useRouter();

  async function loggUt() {
    await fetch("/api/auth/logg-ut", { method: "POST" });
    router.push("/logg-inn");
    router.refresh();
  }

  return (
    <button
      onClick={loggUt}
      className="text-gray-600 hover:text-gray-900 text-sm"
    >
      Logg ut
    </button>
  );
}
