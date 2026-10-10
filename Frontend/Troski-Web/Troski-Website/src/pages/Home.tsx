import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import aerial from "../assets/aerialviewimage.png";
import useSEO from "../hooks/useSEO";

const steps = [
  {
    title: "Request a ride",
    description:
      "Open the app, set your pickup and destination, and see your options.",
  },
  {
    title: "Get matched",
    description:
      "A verified Troski driver on your route accepts and heads your way.",
  },
  {
    title: "Ride and pay",
    description:
      "Hop in, travel safely, and pay digitally when you arrive.",
  },
];

const Home = () => {
  useSEO({
    title: "Troski | Verified Rides in Ghana",
    description:
      "Troski is a scalable transport platform modernizing tro-tro transport in Ghana with digital booking, payments, and trip verification.",
  });

  return (
    <>
      {/* Hero */}
      <section
        id="Hero"
        className="relative flex min-h-[85svh] items-start overflow-hidden md:items-center"
      >
        <div
          className="absolute inset-0 animate-hero-zoom bg-cover bg-center motion-reduce:animate-none"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${aerial})`,
          }}
        />

        <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center gap-5 px-6 pb-16 pt-32 text-center md:items-start md:gap-6 md:px-8 md:pt-28 md:text-left">
          <h1 className="animate-fade-up text-5xl font-bold leading-[1.1] text-white motion-reduce:animate-none sm:text-6xl md:text-7xl">
            Troski in Ghana
          </h1>

          <p
            className="max-w-md animate-fade-up text-base leading-relaxed text-white motion-reduce:animate-none md:max-w-lg md:text-lg lg:text-xl"
            style={{ animationDelay: "150ms" }}
          >
            Wherever you are in Ghana, count on Troski for rides in minutes!
            From Tech Junction to Ayeduase, from Kasoa to Madina, Troski is
            only a tap of a button away.
          </p>

          <div
            className="mt-2 w-full animate-fade-up motion-reduce:animate-none md:mt-4 md:w-auto"
            style={{ animationDelay: "300ms" }}
          >
            <button className="flex w-full cursor-pointer items-center justify-center rounded-xl bg-brand px-5 py-2.5 text-base font-bold text-ink transition duration-300 hover:-translate-y-0.5 hover:bg-brand-dark active:scale-95 md:w-auto md:px-6 md:py-2.5 md:text-lg">
              Get app
            </button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto w-[90%] py-16 md:w-[70%] md:py-24">
        <div className="mb-10 flex flex-col gap-3 md:mb-14">
          <h2 className="text-2xl font-bold tracking-tight md:text-4xl">
            Getting around, made simple
          </h2>
          <p className="max-w-xl text-sm text-ink/70 md:text-base">
            Three steps from where you are to where you're going.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-12">
          {steps.map((step, index) => (
            <div key={step.title} className="flex flex-col gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-base font-bold text-ink">
                {index + 1}
              </span>
              <h3 className="text-lg font-semibold md:text-xl">{step.title}</h3>
              <p className="text-sm text-ink/70 md:text-base">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        <Link
          to="/how-it-works"
          className="mt-10 inline-flex items-center gap-2 font-semibold transition-opacity hover:opacity-60"
        >
          See how it works
          <ArrowRight size={18} />
        </Link>
      </section>

      {/* Drive with us: only on small screens, where the navbar button is hidden */}
      <section className="mx-auto w-[90%] pb-16 md:hidden">
        <div className="flex flex-col items-start gap-5 rounded-3xl bg-ink px-6 py-12 text-white">
          <h2 className="text-2xl font-bold tracking-tight">Drive with Troski</h2>
          <p className="max-w-md text-sm text-white/70">
            Join a verified network of drivers, earn on your own schedule, and
            help modernize transport in Ghana.
          </p>
          <Link
            to="/become-a-driver"
            className="mt-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-ink transition duration-300 hover:-translate-y-0.5 hover:bg-brand-dark active:scale-95"
          >
            Become a Driver
          </Link>
        </div>
      </section>
    </>
  );
};

export default Home;