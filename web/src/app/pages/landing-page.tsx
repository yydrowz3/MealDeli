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
      <section className="landing-hero">
        <div className="landing-hero__copy">
          <p className="landing-eyebrow">Meal delivery for everyone</p>
          <h1>Good meals, delivered simply.</h1>
          <p>Order from local restaurants, run your kitchen, or deliver with us.</p>
          <a className="app-link-button landing-primary-cta" href="#choose-role">
            Get started <ArrowRightIcon aria-hidden="true" />
          </a>
        </div>
        <img
          alt="A fresh MealDeli order ready for delivery"
          className="landing-hero__image"
          src={heroImage}
        />
      </section>

      <section className="landing-section" id="choose-role">
        <div className="landing-section__heading">
          <p className="landing-eyebrow">One platform, three paths</p>
          <h2>Choose how you use MealDeli</h2>
        </div>
        <div className="landing-role-grid">
          {roles.map(({ title, description, href, icon: Icon }) => (
            <a className="landing-role-card" href={href} key={href}>
              <Icon aria-hidden="true" size={28} />
              <h3>{title}</h3>
              <p>{description}</p>
              <span className="landing-role-card__cta">
                {title} <ArrowRightIcon aria-hidden="true" />
              </span>
            </a>
          ))}
        </div>
      </section>

      <section className="landing-section landing-how">
        <div className="landing-section__heading">
          <p className="landing-eyebrow">How it works</p>
          <h2>Start in three simple steps</h2>
        </div>
        <ol>
          <li>
            <span>1</span>
            <strong>Choose your role</strong>
          </li>
          <li>
            <span>2</span>
            <strong>Create your account</strong>
          </li>
          <li>
            <span>3</span>
            <strong>Start with MealDeli</strong>
          </li>
        </ol>
      </section>

      <footer className="landing-footer">
        <div>
          <strong>MealDeli</strong>
          <p>Meal delivery for everyone.</p>
        </div>
        <nav aria-label="Footer navigation">
          <a href="/login">Log in</a>
          <a href="/signup">Sign up</a>
          <a href="/signup?role=OWNER">For restaurants</a>
          <a href="/signup?role=COURIER">For couriers</a>
        </nav>
        <small>© 2026 MealDeli</small>
      </footer>
    </main>
  );
}
