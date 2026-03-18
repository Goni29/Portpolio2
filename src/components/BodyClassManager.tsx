"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function BodyClassManager() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/") {
      document.body.classList.add("page-home");
      document.body.classList.remove("page-sub");
    } else {
      document.body.classList.add("page-sub");
      document.body.classList.remove("page-home");
    }
  }, [pathname]);

  // Re-initialize main.js behaviors on route change
  useEffect(() => {
    const timer = setTimeout(() => {
      // Trigger re-initialization of main.js event listeners
      window.dispatchEvent(new Event("DOMContentLoaded"));
      window.dispatchEvent(new Event("load"));
    }, 100);
    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}
