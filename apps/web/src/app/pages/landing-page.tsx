import { message as localizedMessage, useI18n } from "../../shared/i18n";
import { ArrowRightIcon, BicycleIcon, CookingPotIcon, StorefrontIcon } from "@phosphor-icons/react";
import heroImage from "../../assets/hero.webp";

const roles = [
  {
    title: localizedMessage("landing.orderFood"),
    description: localizedMessage("landing.customerDescription"),
    href: "/signup?role=CUSTOMER",
    icon: CookingPotIcon,
  },
  {
    title: localizedMessage("landing.addRestaurant"),
    description: localizedMessage("landing.ownerDescription"),
    href: "/signup?role=OWNER",
    icon: StorefrontIcon,
  },
  {
    title: localizedMessage("landing.deliver"),
    description: localizedMessage("landing.courierDescription"),
    href: "/signup?role=COURIER",
    icon: BicycleIcon,
  },
] as const;

export function LandingPage() {
  const { t, text } = useI18n();
  return (
    <main>
      <section className="mx-auto grid max-w-content items-center gap-8 px-4 py-12 md:grid-cols-2 md:gap-12 md:py-20">
        <div className="min-w-0">
          <p className="text-small font-extrabold uppercase text-jade-text">
            {t("landing.tagline")}
          </p>
          <h1 className="mt-3 mb-6 text-4xl leading-tight md:text-6xl lg:text-7xl">
            {t("landing.title")}
          </h1>
          <p className="max-w-xl text-lg text-muted">{t("landing.description")}</p>
          <a
            className="inline-flex min-h-control-lg items-center justify-center gap-2 rounded-control border border-transparent bg-jade px-6 py-0 text-on-primary hover:bg-jade-dark hover:text-on-primary-hover mt-6 font-bold"
            href="#choose-role"
          >
            {t("landing.getStarted")}
            <ArrowRightIcon aria-hidden="true" />
          </a>
        </div>
        <img
          alt={t("landing.heroAlt")}
          className="aspect-video w-full rounded-3xl object-cover md:aspect-[4/5]"
          src={heroImage}
        />
      </section>

      <section className="mx-auto max-w-content px-4 py-12 md:py-20" id="choose-role">
        <div className="max-w-2xl">
          <p className="text-small font-extrabold uppercase text-jade-text">
            {t("landing.threePaths")}
          </p>
          <h2 className="mx-0 mt-2 mb-8 text-page">{t("landing.chooseRole")}</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map(({ title, description, href, icon: Icon }) => (
            <a
              className="grid gap-3 rounded-card border border-border bg-surface p-4 md:p-6"
              href={href}
              key={href}
            >
              <Icon aria-hidden="true" size={28} />
              <h3>{text(title)}</h3>
              <p className="text-muted">{text(description)}</p>
              <span className="mt-3 inline-flex items-center gap-2 text-jade-text font-bold">
                {text(title)} <ArrowRightIcon aria-hidden="true" />
              </span>
            </a>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-content px-4 py-12 md:py-20">
        <div className="max-w-2xl">
          <p className="text-small font-extrabold uppercase text-jade-text">
            {t("landing.howItWorks")}
          </p>
          <h2 className="mx-0 mt-2 mb-8 text-page">{t("landing.threeSteps")}</h2>
        </div>
        <ol className="grid grid-cols-3 gap-4 list-none p-0 max-sm:grid-cols-1">
          <li className="flex items-center gap-3 border-t border-t-border pt-4">
            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-jade-soft">
              1
            </span>
            <strong>{t("landing.chooseYourRole")}</strong>
          </li>
          <li className="flex items-center gap-3 border-t border-t-border pt-4">
            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-jade-soft">
              2
            </span>
            <strong>{t("landing.createAccount")}</strong>
          </li>
          <li className="flex items-center gap-3 border-t border-t-border pt-4">
            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-jade-soft">
              3
            </span>
            <strong>{t("landing.start")}</strong>
          </li>
        </ol>
      </section>

      <footer className="mx-auto grid max-w-content gap-6 border-t border-border px-4 py-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <strong>MealDeli</strong>
          <p className="mx-0 mt-1 mb-0 text-muted">{t("landing.footerTagline")}</p>
        </div>
        <nav
          aria-label={t("landing.footerNavigation")}
          className="flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:gap-6"
        >
          <a className="font-semibold" href="/login">
            {t("common.logIn")}
          </a>
          <a className="font-semibold" href="/signup">
            {t("common.signUp")}
          </a>
          <a className="font-semibold" href="/signup?role=OWNER">
            {t("landing.forRestaurants")}
          </a>
          <a className="font-semibold" href="/signup?role=COURIER">
            {t("landing.forCouriers")}
          </a>
        </nav>
        <small className="text-muted">© 2026 MealDeli</small>
      </footer>
    </main>
  );
}
