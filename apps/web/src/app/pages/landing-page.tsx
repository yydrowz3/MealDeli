import { ArrowRightIcon, BicycleIcon, CookingPotIcon, StorefrontIcon } from "@phosphor-icons/react";
import heroImage from "../../assets/hero.webp";

const roles = [
  {
    title: "Order food",
    description: "Find local restaurants and track every order.",
    href: "/signup?role=CUSTOMER",
    icon: CookingPotIcon,
  },
  {
    title: "Add your restaurant",
    description: "Manage your menu, orders, and promotions.",
    href: "/signup?role=OWNER",
    icon: StorefrontIcon,
  },
  {
    title: "Deliver with us",
    description: "Choose an order and follow a simple delivery flow.",
    href: "/signup?role=COURIER",
    icon: BicycleIcon,
  },
] as const;

export function LandingPage() {
  return (
    <main>
      <section className="mx-auto max-w-content px-4 py-[clamp(3rem,8vw,7rem)] grid items-center gap-[clamp(2rem,5vw,5rem)] grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)] min-h-[min(48rem,calc(100vh-4.5rem))] [@media(max-width:39.999rem)]:grid-cols-[1fr] [@media(max-width:39.999rem)]:pt-12">
        <div>
          <p className="m-0 text-[0.8125rem] font-[800] tracking-[0.12em] uppercase text-jade-text">
            Meal delivery for everyone
          </p>
          <h1 className="mx-0 mt-3 mb-6 max-w-[12ch] text-[clamp(2.5rem,6vw,4.75rem)] leading-[0.98] tracking-[-0.045em]">
            Good meals, delivered simply.
          </h1>
          <p className="max-w-[34rem] text-[1.125rem] text-muted">
            Order from local restaurants, run your kitchen, or deliver with us.
          </p>
          <a
            className="inline-flex min-h-control-lg items-center justify-center gap-2 rounded-control border border-solid border-transparent bg-jade px-6 py-0 text-on-primary no-underline hover:bg-jade-dark hover:text-on-primary-hover mt-6 font-[700]"
            href="#choose-role"
          >
            Get started <ArrowRightIcon aria-hidden="true" />
          </a>
        </div>
        <img
          alt="A fresh MealDeli order ready for delivery"
          className="aspect-[4/5] w-full rounded-[2rem] object-cover [@media(max-width:39.999rem)]:aspect-[16/10]"
          src={heroImage}
        />
      </section>

      <section className="mx-auto max-w-content px-4 py-[clamp(3rem,8vw,7rem)]" id="choose-role">
        <div className="max-w-[40rem]">
          <p className="m-0 text-[0.8125rem] font-[800] tracking-[0.12em] uppercase text-jade-text">
            One platform, three paths
          </p>
          <h2 className="mx-0 mt-2 mb-8 text-[length:var(--font-size-page)]">
            Choose how you use MealDeli
          </h2>
        </div>
        <div className="grid grid-cols-3 gap-4 [@media(39.999rem<width<=63.999rem)]:grid-cols-[repeat(2,1fr)] [@media(max-width:39.999rem)]:grid-cols-[1fr]">
          {roles.map(({ title, description, href, icon: Icon }) => (
            <a
              className="grid gap-3 rounded-card border border-solid border-border bg-surface p-[clamp(1.5rem,3vw,2.5rem)] no-underline"
              href={href}
              key={href}
            >
              <Icon aria-hidden="true" size={28} />
              <h3 className="m-0">{title}</h3>
              <p className="m-0 min-h-12 text-muted [@media(max-width:39.999rem)]:min-h-auto">
                {description}
              </p>
              <span className="mt-3 inline-flex items-center gap-2 text-jade-text font-[700]">
                {title} <ArrowRightIcon aria-hidden="true" />
              </span>
            </a>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-content px-4 py-[clamp(3rem,8vw,7rem)]">
        <div className="max-w-[40rem]">
          <p className="m-0 text-[0.8125rem] font-[800] tracking-[0.12em] uppercase text-jade-text">
            How it works
          </p>
          <h2 className="mx-0 mt-2 mb-8 text-[length:var(--font-size-page)]">
            Start in three simple steps
          </h2>
        </div>
        <ol className="m-0 grid grid-cols-[repeat(3,1fr)] gap-4 list-none p-0 [@media(max-width:39.999rem)]:grid-cols-[1fr]">
          <li className="flex items-center gap-3 border-t border-solid border-t-border pt-4">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-[50%] bg-jade-soft">
              1
            </span>
            <strong>Choose your role</strong>
          </li>
          <li className="flex items-center gap-3 border-t border-solid border-t-border pt-4">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-[50%] bg-jade-soft">
              2
            </span>
            <strong>Create your account</strong>
          </li>
          <li className="flex items-center gap-3 border-t border-solid border-t-border pt-4">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-[50%] bg-jade-soft">
              3
            </span>
            <strong>Start with MealDeli</strong>
          </li>
        </ol>
      </section>

      <footer className="mx-auto grid max-w-content grid-cols-[1fr_auto] [align-items:end] gap-6 border-t border-solid border-t-border px-4 py-8 [@media(max-width:39.999rem)]:[align-items:start] [@media(max-width:39.999rem)]:grid-cols-[1fr]">
        <div>
          <strong>MealDeli</strong>
          <p className="mx-0 mt-1 mb-0 text-muted">Meal delivery for everyone.</p>
        </div>
        <nav
          aria-label="Footer navigation"
          className="flex items-center gap-6 [@media(max-width:39.999rem)]:[align-items:start] [@media(max-width:39.999rem)]:flex-col [@media(max-width:39.999rem)]:gap-3"
        >
          <a className="font-[650] no-underline" href="/login">
            Log in
          </a>
          <a className="font-[650] no-underline" href="/signup">
            Sign up
          </a>
          <a className="font-[650] no-underline" href="/signup?role=OWNER">
            For restaurants
          </a>
          <a className="font-[650] no-underline" href="/signup?role=COURIER">
            For couriers
          </a>
        </nav>
        <small className="text-muted">© 2026 MealDeli</small>
      </footer>
    </main>
  );
}
