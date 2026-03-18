"use client";

import { useEffect } from "react";

export default function SubPageWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.body.classList.add("page-sub");
    document.body.classList.remove("page-home");
    return () => {
      document.body.classList.remove("page-sub");
    };
  }, []);

  return <>{children}</>;
}
