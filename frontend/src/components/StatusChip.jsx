import React from "react";

export default function StatusChip({ variant = "default", label }) {
  const cls = variant && variant !== "default" ? `chip chip-${variant}` : "chip";
  return (
    <span className={cls}>
      <span className="dot" />
      {label}
    </span>
  );
}
