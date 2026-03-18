"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function BodyClassManager() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/") {
      document.body.className = "page-home";
    } else {
      document.body.className = "page-sub";
    }
  }, [pathname]);

  return null;
}
