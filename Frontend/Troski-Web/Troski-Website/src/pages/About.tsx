import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import pattern from "../assets/ghanaSymbols.png";
import goldBackground from "../assets/goldBackground.png";
import trust from "../assets/trust.png";
import accessibility from "../assets/accessibility.png";
import growth from "../assets/growth.png";
import useSEO from "../hooks/useSEO";

const sections = [
    {
        title: "Starting at KNUST",
        description:
            "The KNUST campus is our first controlled deployment, a real-world proving ground where we test the platform's reliability, safety, and usability before expanding to towns and cities across Ghana and beyond.",
        link: { label: "See how it works", to: "/how-it-works" },
    },
    {
        title: "Rides and earning",
        description:
            "We help passengers get from point A to point B with digital booking and payments. We also give drivers a better way to earn, with verified trips and a simple way to manage their work.",
        link: { label: "Become a driver", to: "/become-a-driver" },
    },
    {
        title: "Your safety drives us",
        description:
            "Whether you're in the passenger seat or behind the wheel, trust matters. Drivers are verified before they are approved, and every trip is recorded, so everyone knows who they're riding with.",
        link: { label: "Read the FAQs", to: "/faqs" },
    },
];

const values = [
    {
        title: "Trust",
        description:
            "Every trip is verified, so passengers and drivers know exactly who they're riding with.",
        image: trust,
    },
    {
        title: "Accessibility",
        description:
            "Built for the transport systems people already use, not to replace them. We make them safer and easier.",
        image: accessibility,
    },
    {
        title: "Growth",
        description:
            "Designed from day one to scale beyond campus, into cities and markets across the region.",
        image: growth,
    },
];

const updates = [
    {
        title: "FAQs",
        description:
            "Answers to common questions from passengers and drivers.",
        link: { label: "Read the FAQs", to: "/faqs" },
    },
    {
        title: "Contact",
        description:
            "Questions, feedback or partnerships? Get in touch with the team.",
        link: { label: "Contact us", to: "/contact" },
    },
    {
        title: "Drive with us",
        description:
            "Join a verified network of drivers and earn on your own schedule.",
        link: { label: "Apply now", to: "/become-a-driver" },
    },
];

const TextLink = ({ to, label }: { to: string; label: string }) => (
    <Link
        to={to}
        className="group inline-flex items-center gap-2 font-semibold text-black underline decoration-black/30 underline-offset-4 transition hover:decoration-black"
    >
        {label}
        <ArrowRight
            size={18}
            className="transition-transform group-hover:translate-x-1"
        />
    </Link>
);

const About = () => {
    useSEO({
        title: "About Us | Troski",
        description:
            "Learn about Troski's mission to modernize tro-tro transport in Ghana, starting with a pilot at KNUST.",
    });

    return (
        <main className="w-full bg-[#FAF9F6]">
            {/* Hero statement */}
            <section className="px-5 pt-28 sm:px-8 md:pt-24 lg:px-12">
                <div className="mx-auto w-full max-w-7xl">
                    <p className="mb-4 text-base font-medium text-black/50 md:text-lg">
                        About us
                    </p>
                    <h1 className="max-w-4xl text-5xl font-medium leading-[1.0] tracking-tight text-black md:text-7xl">
                        We reimagine the way Ghana moves.
                    </h1>
                    <p className="mt-6 max-w-2xl text-lg leading-snug text-black/70 md:mt-8 md:text-lg">
                        Troski is a transport coordination and verification platform. We're
                        bringing digital booking, payments, and trip verification to the
                        tro-tro, a system millions rely on every day. For passengers who
                        want to get there safely. For drivers who want to earn more. Built
                        in Ghana, ready for the places that move like it.
                    </p>
                </div>
            </section>

            {/* Stacked sections */}
            <section className="mx-auto w-full max-w-7xl px-5 pt-16 sm:px-8 md:pt-24 lg:px-12">
                <div className="flex flex-col divide-y divide-black/10 border-y border-black/10">
                    {sections.map((section) => (
                        <div
                            key={section.title}
                            className="grid grid-cols-1 gap-4 py-10 md:grid-cols-3 md:gap-10 md:py-14"
                        >
                            <h2 className="text-2xl font-medium tracking-tight text-black md:text-3xl">
                                {section.title}
                            </h2>
                            <div className="flex flex-col items-start gap-5 md:col-span-2">
                                <p className="max-w-2xl text-base leading-7 text-black/70 md:text-lg">
                                    {section.description}
                                </p>
                                <TextLink to={section.link.to} label={section.link.label} />
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Values */}
            <section className="mx-auto w-full max-w-7xl px-5 pt-16 sm:px-8 md:pt-24 lg:px-12">
                <h2 className="mb-8 text-2xl font-medium tracking-tight text-black md:mb-12 md:text-3xl">
                    What we stand for
                </h2>
                <div className="grid grid-cols-1  gap-8 md:grid-cols-3 md:gap-10">
                    {values.map((value) => (
                        <div key={value.title} className="pt-5  px-6 py-6 rounded-lg">

                                <img
                                    src={value.image}
                                    alt={value.title}
                                    className="mx-auto mb-8 block h-44 w-44 object-contain sm:h-48 sm:w-48 md:h-56 md:w-56"
                                />


                            <h3 className="mb-2 text-lg font-medium text-black md:text-xl">
                                {value.title}
                            </h3>
                            <p className="text-base leading-tight text-black/70">
                                {value.description}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Keep up */}
            <section className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 md:py-24 lg:px-12">
                <h2 className="mb-8 text-2xl font-medium tracking-tight text-black md:mb-12 md:text-3xl">
                    Keep up with Troski
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
                    {updates.map((item) => (
                        <div
                            key={item.title}
                            className="flex flex-col items-start mb-2 rounded-2xl p-6 md:p-8"
                        >
                            <h3 className="text-lg font-semibold mb-2 text-black md:text-xl">
                                {item.title}
                            </h3>
                            <p className="text-base leading-7 mb-8 text-black/70">
                                {item.description}
                            </p>
                            <div className="mt-auto">
                                <TextLink to={item.link.to} label={item.link.label} />
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Call to action */}
            <section className="relative flex h-[320px] flex-col items-center justify-start overflow-hidden bg-brand md:h-[420px]">

                <h2 className="relative z-10 mb-2 mt-12 max-w-[80%] text-center text-[clamp(2rem,5vw,3.75rem)] font-medium leading-none tracking-tight text-black md:mt-24 md:max-w-[60%]">
                    Come move with us.
                </h2>
                <p className="relative z-10 mb-1 max-w-[80%] text-center text-[clamp(1rem,1.6vw,1.25rem)] font-normal leading-tight tracking-tight text-black md:mb-4 md:max-w-[60%] lg:max-w-[40%]">
                    Ride with verified drivers, or drive and earn on your own schedule.
                </p>

                <div className="relative z-10 mt-4 flex w-full flex-col items-center justify-center gap-2 md:mt-8 md:flex-row md:gap-4">
                    <Link
                        to="/"
                        className="rounded-md bg-black px-6 py-2 font-medium text-white hover:bg-black/80"
                    >
                        Ride with Troski
                    </Link>
                    <Link
                        to="/become-a-driver"
                        className="rounded-md bg-white px-6 py-2 font-medium text-black hover:bg-white/80"
                    >
                        Drive with Troski
                    </Link>
                </div>
            </section>
        </main>
    );
};

export default About;