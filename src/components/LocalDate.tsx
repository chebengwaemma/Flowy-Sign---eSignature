"use client";

import { useEffect, useState } from "react";
import { formatLocalStamp } from "@/lib/signing-time";

/** Renders an instant in the viewer's device timezone after the browser is available. */
export function LocalDate({ iso }: { iso?: string | null }) {
  const [label, setLabel] = useState("—");

  useEffect(() => {
    setLabel(formatLocalStamp(iso));
  }, [iso]);

  return <time dateTime={iso || undefined}>{label}</time>;
}
