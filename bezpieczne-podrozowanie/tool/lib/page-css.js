(function (g) {
  const CT = (g.CT = g.CT || {});

  const BASE = `
:root {
  --ct-ff: "Manrope", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
  --ct-c-heading: #333333;
  --ct-c-body: #717182;
  --ct-c-link: #5D7285;
  --ct-c-border: #EDEBEB;
  --ct-c-border-card: rgba(0, 0, 0, 0.175);
  --ct-c-muted: #F3F4F6;
  --ct-c-soft: #F9FAFB;
  --ct-c-accent: #155DFC;
  --ct-c-white: #ffffff;
  --ct-space-2xs: 0.25rem;
  --ct-space-xs: 0.5rem;
  --ct-space-sm: 1rem;
  --ct-space-md: 1.5rem;
  --ct-space-lg: 2rem;
  --ct-space-xl: 3rem;
  --ct-space-2xl: 6rem;
  --ct-radius-sm: 0.25rem;
  --ct-radius-card: 0.375rem;
  --ct-radius-md: 0.5rem;
  --ct-radius-lg: 0.875rem;
  --ct-row-min: 3.5rem;
  --ct-maxw: 82.5rem;
  --ct-gutter: 0.75rem;
}


.travel-hero,
.travel-page,
.travel-hero *,
.travel-page * {
  box-sizing: border-box;
}

.travel-hero {
  position: relative;
  width: 100%;
  height: 26.25rem;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--ct-space-xl) 0;
}

.travel-hero__bg {
  position: absolute;
  inset: 0;
}

.travel-hero__img {
  display: block;
  width: 100%;
  max-width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.travel-hero__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(29, 41, 61, 0.84) 0%, rgba(29, 41, 61, 0.2) 100%);
}

.travel-hero__content {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 50rem;
  margin: 0 auto;
  padding: 0 var(--ct-gutter);
}

.travel-hero__title {
  margin: 0 0 var(--ct-space-sm);
  color: var(--ct-c-white);
  font: 600 2rem/2.5rem var(--ct-ff);
}

.travel-hero__subtitle {
  margin: 0 0 1.75rem;
  color: var(--ct-c-white);
  font: 400 1rem/1.375rem var(--ct-ff);
}

.button {
  display: inline-block;
  border: 0;
  border-radius: var(--ct-radius-md);
  cursor: pointer;
  font: 600 1rem/1.5 var(--ct-ff);
  text-align: center;
  text-decoration: none;
  transition: opacity 0.3s ease, transform 0.2s ease;
}

.button--primary {
  min-height: 3.5rem;
  padding: 1rem 2.5rem;
  font-size: 1.125rem;
  background: linear-gradient(180deg, #25AFEB, #0093D0);
}

.travel-hero a.button--primary,
.travel-page a.button--primary {
  color: var(--ct-c-white);
  text-decoration: none;
}

.button--primary:hover {
  opacity: 0.9;
  transform: translateY(-2px);
}

.button--primary:active {
  opacity: 0.85;
  transform: translateY(0);
}

.button--block {
  display: block;
  width: 100%;
}

.button:focus-visible,
.destinations-nav__item:focus-visible {
  outline: 2px solid #0093D0;
  outline-offset: 2px;
}

.travel-page {
  padding: var(--ct-space-xl) 0;
}

.travel-page__inner {
  width: 100%;
  max-width: var(--ct-maxw);
  margin: 0 auto;
  padding: 0 var(--ct-gutter);
  display: grid;
  gap: var(--ct-space-xl);
}

.destination-header {
  display: flex;
  align-items: center;
  gap: var(--ct-space-md);
  margin-bottom: var(--ct-space-2xl);
}

.destination-header__flag {
  display: block;
  flex: 0 0 auto;
  width: 5.25rem;
  max-width: 100%;
  height: 3.75rem;
  border-radius: var(--ct-radius-card);
  object-fit: cover;
}

.destination-header__title {
  margin: 0;
  color: var(--ct-c-heading);
  font: 600 2.125rem/2.75rem var(--ct-ff);
}

.destination-header__subtitle {
  margin: 0;
  color: var(--ct-c-body);
  font: 400 1rem/1.5rem var(--ct-ff);
}

.info-section {
  margin-bottom: var(--ct-space-xl);
}

.info-section:last-child {
  margin-bottom: 0;
}

.info-section__head {
  display: flex;
  align-items: center;
  gap: var(--ct-space-sm);
  margin-bottom: var(--ct-space-md);
}

.info-section__icon {
  flex: 0 0 auto;
  width: 1.75rem;
  height: 1.75rem;
  color: var(--ct-c-heading);
}

.info-section__title {
  margin: 0;
  color: var(--ct-c-heading);
  font: 600 1.5rem/2.125rem var(--ct-ff);
}

.info-section__body {
  display: flex;
  flex-direction: column;
  gap: var(--ct-space-sm);
}

.info-card {
  padding: var(--ct-space-md);
  background: var(--ct-c-white);
  border: 1px solid var(--ct-c-border);
  border-radius: var(--ct-radius-sm);
  transition: box-shadow 0.25s ease, transform 0.25s ease, border-color 0.25s ease;
}

.info-card:hover {
  border-color: transparent;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04);
  transform: translateY(-1px);
}

.info-card__title {
  margin: 0 0 var(--ct-space-xs);
  color: rgba(51, 51, 51, 0.9);
  font: 700 1rem/1.5rem var(--ct-ff);
}

.info-card__text {
  margin: 0;
  color: var(--ct-c-body);
  font: 400 1rem/1.5rem var(--ct-ff);
}

.info-card__text ul,
.info-card__text ol,
.fact-list__desc ul,
.fact-list__desc ol,
.official-source__text ul,
.official-source__text ol {
  margin: var(--ct-space-xs) 0;
  padding-left: var(--ct-space-md);
}

.info-card__text li,
.fact-list__desc li,
.official-source__text li {
  margin: 0 0 0.25rem;
}

.info-card__text li:last-child,
.fact-list__desc li:last-child,
.official-source__text li:last-child {
  margin-bottom: 0;
}

.fact-box {
  padding: var(--ct-space-md);
  background: var(--ct-c-white);
  border: 1px solid var(--ct-c-border);
  border-radius: var(--ct-radius-sm);
}

.fact-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.fact-list__item {
  display: flex;
  align-items: flex-start;
  gap: var(--ct-space-xs);
  margin-bottom: var(--ct-space-sm);
}

.fact-list__item:last-child {
  margin-bottom: 0;
}

.fact-list__marker {
  position: relative;
  flex: 0 0 1.25rem;
  width: 1.25rem;
  height: 1.5rem;
}

.fact-list__marker::after {
  content: "";
  position: absolute;
  left: 0.4375rem;
  top: 0.5625rem;
  width: 0.375rem;
  height: 0.375rem;
  background: var(--ct-c-accent);
  border-radius: 9999px;
}

.fact-list__term {
  margin: 0;
  color: rgba(51, 51, 51, 0.9);
  font: 700 1rem/1.5rem var(--ct-ff);
}

.fact-list__desc {
  margin: 0;
  color: var(--ct-c-body);
  font: 400 1rem/1.5rem var(--ct-ff);
}

.destination-photo {
  position: relative;
  height: 17.5rem;
  margin: 0 0 var(--ct-space-xl);
  background: #F2F3FF;
  border-radius: var(--ct-radius-sm);
  overflow: hidden;
}

.destination-photo__img {
  display: block;
  position: absolute;
  inset: 0;
  width: 100%;
  max-width: 100%;
  height: 100%;
  object-fit: cover;
}

.destination-photo__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(227deg, rgba(254, 234, 222, 0) 0%, rgba(84, 45, 21, 0.404) 96%);
  z-index: 1;
}

.destination-photo__caption {
  position: absolute;
  left: var(--ct-space-md);
  bottom: var(--ct-space-md);
  z-index: 2;
  margin: 0;
  color: var(--ct-c-white);
  font: 400 1.125rem/1.5rem var(--ct-ff);
}

.destinations-nav {
  margin-bottom: var(--ct-space-xl);
  padding: var(--ct-space-md);
  background: var(--ct-c-white);
  border: 1px solid var(--ct-c-border-card);
  border-radius: var(--ct-radius-card);
}

.destinations-nav__title {
  margin: 0 0 var(--ct-space-md);
  color: var(--ct-c-heading);
  font: 600 1.125rem/1.5rem var(--ct-ff);
}

.destinations-nav__list {
  display: flex;
  flex-direction: column;
  gap: var(--ct-space-xs);
  margin: 0;
  padding: 0;
  list-style: none;
}

.destinations-nav__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ct-space-sm);
  min-height: var(--ct-row-min);
  padding: var(--ct-space-xs) var(--ct-space-sm);
  border-radius: var(--ct-radius-lg);
  font: 400 1rem/1.5rem var(--ct-ff);
  text-decoration: none;
  transition: background-color 0.2s ease;
}

.destinations-nav a.destinations-nav__item {
  color: var(--ct-c-link);
  text-decoration: none;
}

.destinations-nav__item:hover {
  background: var(--ct-c-muted);
}

.destinations-nav__arrow {
  display: block;
  flex: 0 0 auto;
  width: 1.5rem;
  max-width: 100%;
  height: 1.5rem;
}

.official-source {
  padding: var(--ct-space-md);
  background: var(--ct-c-soft);
  border: 1px solid var(--ct-c-border);
  border-radius: var(--ct-radius-card);
}

.official-source__icon {
  width: 1.75rem;
  height: 1.75rem;
  margin-bottom: var(--ct-space-sm);
  color: var(--ct-c-heading);
}

.official-source__title {
  margin: 0 0 var(--ct-space-sm);
  color: var(--ct-c-heading);
  font: 600 1.125rem/1.5rem var(--ct-ff);
}

.official-source__text {
  margin: 0 0 var(--ct-space-md);
  color: var(--ct-c-body);
  font: 400 1rem/1.5rem var(--ct-ff);
}

@media (min-width: 36em) {
  .travel-hero {
    height: 28.75rem;
  }

  .travel-hero__title {
    font-size: 2.5rem;
    line-height: 3rem;
  }

  .travel-hero__subtitle {
    font-size: 1.125rem;
    line-height: 1.5rem;
  }
}

@media (min-width: 62em) {
  .travel-hero {
    height: 36.25rem;
  }

  .travel-hero__title {
    font-size: 3.625rem;
    line-height: 4.25rem;
    margin-bottom: var(--ct-space-sm);
  }

  .travel-hero__subtitle {
    font-size: 1.25rem;
    line-height: 1.625rem;
    margin-bottom: 2.25rem;
  }

  .travel-page__inner {
    grid-template-columns: calc(58.333333% - 1.25rem) calc(41.666667% - 1.75rem);
  }

  .destination-header__title {
    font-size: 2.625rem;
    line-height: 3.25rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .button,
  .info-card,
  .destinations-nav__item {
    transition: none;
  }

  .button--primary:hover,
  .info-card:hover {
    transform: none;
  }
}
`;

  const MORE_LINK = `
.more-info {
  display: flex;
  align-items: center;
  gap: var(--ct-space-sm);
  margin-top: var(--ct-space-md);
}

.more-info__label {
  margin: 0;
  color: var(--ct-c-body);
  font: 400 1rem/1.5rem var(--ct-ff);
}

.more-link {
  display: inline-flex;
  align-items: center;
  gap: var(--ct-space-xs);
  font: 500 0.875rem/1.5rem var(--ct-ff);
  text-decoration: none;
  transition: color 0.2s ease;
}

.travel-page a.more-link {
  color: var(--ct-c-heading);
}

.travel-page a.more-link:hover {
  color: #23CB71;
  text-decoration: underline;
}

.more-link:focus-visible {
  outline: 2px solid #0093D0;
  outline-offset: 2px;
}
`;

  const NAV_MORE = `
.destinations-nav__more {
  display: flex;
  flex-direction: column-reverse;
}

.destinations-nav__more > .destinations-nav__list {
  margin-top: var(--ct-space-xs);
}

.destinations-nav__toggle {
  display: block;
  margin-top: var(--ct-space-md);
  padding: 0.75rem 2rem;
  background: var(--ct-c-white);
  border: 1px solid var(--ct-c-border);
  border-radius: var(--ct-radius-md);
  color: var(--ct-c-heading);
  font: 400 1rem/1.5rem var(--ct-ff);
  text-align: center;
  cursor: pointer;
  list-style: none;
  transition: background-color 0.2s ease;
}

.destinations-nav__toggle::-webkit-details-marker {
  display: none;
}

.destinations-nav__toggle:hover {
  background: var(--ct-c-muted);
}

.destinations-nav__toggle:focus-visible {
  outline: 2px solid #0093D0;
  outline-offset: 2px;
}

.destinations-nav__toggle-less,
.destinations-nav__more[open] .destinations-nav__toggle-more {
  display: none;
}

.destinations-nav__more[open] .destinations-nav__toggle-less {
  display: inline;
}

@media (prefers-reduced-motion: reduce) {
  .destinations-nav__toggle {
    transition: none;
  }
}
`;

  function build(db, slug, opts) {
    const options = opts || { includeSync: false };
    const dest = CT.model.find(db, slug);
    const menu = CT.model.menuFor(db, slug);
    let css = BASE;
    if (dest && dest.practicalInfo && dest.practicalInfo.moreLink && dest.practicalInfo.moreLink.href) {
      css += MORE_LINK;
    }
    if (menu.length > (db.nav.visibleCount || 5) || options.includeSync) {
      css += NAV_MORE;
    }
    return '<style>' + css.replace(/\n{3,}/g, '\n\n') + '</style>\n';
  }

  CT.pageCss = { build };
})(globalThis);
