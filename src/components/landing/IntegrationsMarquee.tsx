import { INTEGRATION_LOGOS } from "./IntegrationLogos";

export function IntegrationsMarquee() {
  const track = [...INTEGRATION_LOGOS, ...INTEGRATION_LOGOS];

  return (
    <div className="lp-integ-marquee" aria-label="Partner integrations" data-animate="fade">
      <div className="lp-integ-marquee-fade left" aria-hidden />
      <div className="lp-integ-marquee-fade right" aria-hidden />
      <div className="lp-integ-marquee-track">
        {track.map(({ name, Logo }, i) => (
          <div key={`${name}-${i}`} className="lp-integ-item" title={name} aria-hidden={i >= INTEGRATION_LOGOS.length}>
            <span className="lp-integ-logo-wrap">
              <Logo />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
