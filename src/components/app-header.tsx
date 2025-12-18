"use client";

import React from "react";
import { usePathname } from "next/navigation";

export default function AppHeader() {
  const pathname = usePathname() || "";

  let title = "Documents";
  if (pathname.startsWith("/app/referrals")) title = "Referrals";
  else if (pathname.startsWith("/app/statements")) title = "Statements";
  else if (pathname.startsWith("/app/dashboard")) title = "Dashboard";

  return <h1 className="text-lg font-semibold">{title}</h1>;
}
