import Link from "next/link";

export function SiteFooter({
  brandName = "Flowy Sign - eSignature",
  address = "Austell GA, USA",
  links = [
    { label: "About Us", href: "/about" },
    { label: "Pricing", href: "/pricing" },
    { label: "Contact", href: "/contact" },
    { label: "Terms & Conditions", href: "/terms" },
  ],
}: {
  brandName?: string;
  address?: string;
  links?: { label: string; href: string }[];
}) {
  const year = new Date().getFullYear();

  return (
    <footer className="lp-footer">
      <div className="lp-footer-inner">
        <div className="lp-footer-brand">
          <p className="lp-footer-name">{brandName}</p>
          <p>{address}</p>
        </div>
        <nav className="lp-footer-links" aria-label="Footer">
          {links.map((link) => (
            <Link key={link.href + link.label} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="lp-footer-bottom">
        <p className="lp-footer-copy">
          © {year} {brandName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
