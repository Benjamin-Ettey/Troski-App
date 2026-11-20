import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import troskiHeroVideo from "../assets/Troski Website Motion Graphics.mp4";
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
    title: "Pay and ride",
    description:
      "Pay digitally, hop in, and travel safely.",
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

      {/* Intro: bold text before the hero image */}
      <section className=" bg-[#FAF9F6] px-6 pt-28 md:px-10 md:pt-40">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-5 text-center md:gap-6">
          <h1 className="md:text-5xl text-4xl font-bold leading-[1.0] mb-2 tracking-tight text-black sm:text-5xl md:text-7xl">
            Better rides. Better opportunities.
          </h1>

          <p className="max-w-md text-base leading-tight text-black/80 md:max-w-2xl lg:max-w-3xl md:text-lg lg:text-xl">
            Get where you need to go with greater ease, or get on the road and earn. Troski creates better opportunities for passengers and drivers alike.
          </p>

          <div className="mt-2 flex w-full flex-col md:flex-row items-center justify-center gap-3 md:mt-4 md:w-auto md:gap-4">
            <button className="flex-1 cursor-pointer w-full md:w-48 rounded-xl bg-brand px-5 py-2.5 md:py-2 text-sm font-medium text-black hover:bg-brand-dark md:flex-none md:px-6 md:text-lg">
              Get Troski
            </button>
            <button className="flex-1 cursor-pointer w-full md:w-48 rounded-xl bg-black px-5 py-2.5 md:py-2 text-sm font-medium text-white  hover:bg-ink-hover md:flex-none md:px-6 md:text-lg">
              Get Troski Driver
            </button>
          </div>
        </div>
      </section>

      {/* Hero */}
      {/* Hero video */}
      <section
          id="Hero"
          className="bg-[#FAF9F6] px-4 pb-2 pt-10 sm:px-8 md:pb-20 md:pt-16 lg:px-12"
      >
        <div className="mx-auto w-full max-w-6xl overflow-hidden rounded-2xl bg-black/5 md:rounded-3xl">
          <video
              className="aspect-video w-full object-cover"
              src={troskiHeroVideo}
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              aria-hidden="true"
          />
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-24">
        <div className="mb-8 flex flex-col gap-3 sm:mb-10 lg:mb-14">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
            Getting around, made simple
          </h2>
          <p className="max-w-xl text-base text-black/50 lg:text-lg">
            Three steps from where you are to where you're going.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3 lg:gap-12">
          {steps.map((step) => (
              <div key={step.title} className="flex flex-col gap-3">
                <div className="aspect-4/3 w-full rounded-xl bg-black/10" />
                <h3 className="text-lg font-semibold lg:text-xl">{step.title}</h3>
                <p className="text-base text-black/50">{step.description}</p>
              </div>
          ))}
        </div>

        <Link
            to="/how-it-works"
            className="mt-10 inline-flex items-center bg-brand gap-2 px-4 py-2 rounded-lg font-semibold transition-opacity hover:opacity-60"
        >
          See how it works
          <ArrowRight size={18} />
        </Link>
      </section>

      {/* Drive with us: only on small screens, where the navbar button is hidden */}
      <section className="mx-auto w-[90%] pb-16 md:hidden">
        <div className="flex flex-col items-start rounded-md bg-ink px-6 py-4 text-white">
          <h2 className="text-2xl font-bold tracking-tight mb-2">Drive with Troski</h2>
          <p className="max-w-md text-sm text-white/70 mb-4">
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