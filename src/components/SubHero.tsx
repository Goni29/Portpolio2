interface SubHeroProps {
  title: string;
  menuTitle?: string;
  activeSlug: string;
  menuItems?: { label: string; slug: string }[];
}

export default function SubHero({
  title,
  menuTitle,
  activeSlug,
  menuItems,
}: SubHeroProps) {
  const subcols = menuItems?.length || 0;

  return (
    <>
      <section className="sub-hero fullbleed">
        <div
          className="sub-hero-bg"
          style={{ backgroundImage: "url('/img/hero_sub.webp')" }}
        ></div>
        <div className="sub-hero-dim"></div>

        <div className="sub-hero-inner container">
          <div className="sub-hero-content">
            <h1 className="sub-hero-title">{title}</h1>

            <div className="sub-hero-bc">
              <a className="bc-home" href="/" aria-label="홈">
                <svg className="bc-home-ico" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M12 3.2 3 10.5v10.3h6.3v-6.4h5.4v6.4H21V10.5L12 3.2Zm7.2 15.8h-2.7v-6.4H7.5v6.4H4.8v-7.6L12 5.9l7.2 5.5v7.6Z"
                  />
                </svg>
              </a>
              {menuTitle && (
                <>
                  <span className="bc-sep">&rsaquo;</span>
                  <span className="bc-item">{menuTitle}</span>
                </>
              )}
              <span className="bc-sep">&rsaquo;</span>
              <span className="bc-item is-current">{title}</span>
            </div>
          </div>
        </div>
      </section>

      {menuItems && menuItems.length > 0 && (
        <section
          className={`subnav fullbleed${subcols <= 5 ? " subnav-fit" : ""}`}
          style={{ "--subtab-cols": subcols } as React.CSSProperties}
        >
          <div className="full-content">
            <div className="subnav-inner">
              {menuItems.map((it, idx) => (
                <a
                  className={`subnav-link${it.slug === activeSlug ? " is-active" : ""}`}
                  href={`/${it.slug}`}
                  key={idx}
                >
                  {it.label}
                </a>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
