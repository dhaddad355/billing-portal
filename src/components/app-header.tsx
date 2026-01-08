"use client";

import React from "react";
import { usePathname } from "next/navigation";

export default function AppHeader() {
  const pathname = usePathname() || "";

  let title = "Documents";
  if (pathname.startsWith("/referrals")) title = "Referrals";
  else if (pathname.startsWith("/statements")) title = "Statements";
  else if (pathname.startsWith("/statements-processing")) title = "Statements";
  else if (pathname.startsWith("/open-statements")) title = "Statements";
  else if (pathname.startsWith("/dashboard")) title = "Dashboard";
  else if (pathname.startsWith("/settings")) title = "Settings";

  return <h1 className="text-lg font-semibold">{title}</h1>;
}
