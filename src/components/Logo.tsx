import Link from "next/link";

export function Logo({
  light = false,
  href = "/",
  compact = false,
  label = "Flowy Sign - eSignature",
  blue = false,
}: {
  light?: boolean;
  href?: string;
  compact?: boolean;
  label?: string;
  blue?: boolean;
}) {
  return (
    <Link href={href} className="inline-flex min-w-0 max-w-full items-center gap-2.5">
      <span
        className={`lp-brand-mark grid shrink-0 place-items-center rounded-lg font-bold text-white ${
          compact ? "h-8 w-8 text-xs" : "h-9 w-9 text-sm"
        }`}
        style={{
          background: blue
            ? "#0061ff"
            : light
              ? "rgba(255,255,255,0.14)"
              : "linear-gradient(135deg, #0b3d38 0%, #1fa97a 100%)",
        }}
        aria-hidden
      >
        FS
      </span>
      <span
        className={`whitespace-nowrap font-semibold tracking-tight ${compact ? "text-[14px] sm:text-[16px]" : "display text-[15px] sm:text-lg"} ${
          light ? "text-white" : "text-[#1e1919]"
        }`}
      >
        {label}
      </span>
    </Link>
  );
}
