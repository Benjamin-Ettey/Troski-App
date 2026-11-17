
import { BadgeCheck, Download, FileText } from "lucide-react";
import useSEO from "../hooks/useSEO";

// Benefit illustrations
import incomeImage from "../assets/cash.png";
import paymentsImage from "../assets/payments.png";
import handshakeImage from "../assets/shakehands.png";
import growthImage from "../assets/growth.png";

// TODO: Replace with the real store link once the app is published
const APP_STORE_URL = "#";

const benefits = [
  {
    title: "Earn on your schedule",
    description:
        "Enjoy the flexibility to drive when it works best for you.",
    image: incomeImage,
    imageAlt: "Income and earnings illustration",
  },
  {
    title: "Go cashless",
    description:
        "Receive digital payments and spend less time handling cash.",
    image: paymentsImage,
    imageAlt: "Digital payments illustration",
  },
  {
    title: "Build passenger trust",
    description:
        "Get verified and build confidence with every passenger.",
    image: handshakeImage,
    imageAlt: "Handshake and trust illustration",
  },
  {
    title: "Grow with Troski",
    description:
        "Be part of a growing, structured transport network.",
    image: growthImage,
    imageAlt: "Business growth illustration",
  },
];

const steps = [
  {
    icon: Download,
    title: "Download the app",
    description:
        "Get the Troski app on your phone from the App Store or Google Play.",
  },
  {
    icon: FileText,
    title: "Fill in your details",
    description:
        "Create your driver profile in the app and add your personal and vehicle information.",
  },
  {
    icon: BadgeCheck,
    title: "Get verified and drive",
    description:
        "Once your details are checked and approved, you can start accepting trips.",
  },
];

const StoreButtons = () => {
  return (
      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <a
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col justify-center items-center rounded-xl bg-[#ffcc00] px-6 py-3 text-left text-black transition hover:opacity-90"
        >
        <span className="text-base font-semibold text-center">
          Download Troski Driver
        </span>
        </a>
      </div>
  );
};

const BecomeDriver = () => {
  useSEO({
    title: "Become a Driver | Troski",
    description:
        "Join Troski's verified driver network. Learn about the benefits and how to apply.",
  });

  return (
      <div className="flex flex-col items-center gap-12 pb-24 md:gap-16">

        {/* Hero Section */}
        <section className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-6 pt-12 text-center md:px-8">
          <h1 className="text-4xl font-bold md:text-5xl">
            Become a Troski Driver
          </h1>

          <p className="text-base text-black/50 md:text-lg">
            Join a verified network of drivers and be part of modernizing
            transport in Ghana.
          </p>

          <div className="mt-2 flex w-full flex-col items-center gap-3">
            <StoreButtons />
          </div>
        </section>

        {/* How to Apply Section */}
        <section className="mt-16 flex w-[90%] max-w-5xl flex-col gap-6 md:gap-8">
          <h2 className="text-2xl font-bold md:text-3xl text-black">
            How to apply
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
            {steps.map((step, index) => (
                <div
                    key={step.title}
                    className="flex flex-col gap-3 rounded-2xl p-6"
                >
                  <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-black/50">
                  Step {index + 1}
                </span>
                  </div>

                  <h3 className="text-lg font-semibold md:text-xl">
                    {step.title}
                  </h3>

                  <p className="text-sm text-gray-600 md:text-base">
                    {step.description}
                  </p>
                </div>
            ))}
          </div>
        </section>

        {/* Why Drive with Troski Section */}
        <section className="flex w-[90%] max-w-5xl flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold md:text-3xl">
              Why drive with Troski?
            </h2>

            <p className="text-sm text-black/50 md:text-base">
              More flexibility, easier payments and more opportunities.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit) => (
                <div
                    key={benefit.title}
                    className="flex h-full min-h-[340px] flex-col rounded-2xl bg-brand p-5 transition duration-300 hover:-translate-y-1 md:p-6"
                >
                  {/* Illustration */}
                  <div className="flex aspect-[4/3] w-full shrink-0 items-center justify-center">
                    <img
                        src={benefit.image}
                        alt={benefit.imageAlt}
                        className="h-full w-full object-contain"
                        loading="lazy"
                    />
                  </div>

                  {/* Benefit Details */}
                  <div className="mt-auto flex flex-col gap-2 pt-5">
                    <h3 className="text-lg font-semibold text-black">
                      {benefit.title}
                    </h3>

                    <p className="text-sm leading-tight text-black">
                      {benefit.description}
                    </p>
                  </div>
                </div>
            ))}
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="flex w-[90%] max-w-5xl flex-col items-center gap-4 rounded-lg bg-black px-6 py-10 text-center md:py-14">
          <h2 className="text-2xl font-bold text-white md:text-3xl">
            Ready to start driving?
          </h2>

          <p className="max-w-xl text-sm text-white/70 md:text-base">
            Download the Troski app, fill in your details and get verified.
          </p>

          <div className="mt-2">
            <StoreButtons />
          </div>
        </section>

      </div>
  );
};

export default BecomeDriver;
