import { Download } from "lucide-react";
import homeScreen from "../assets/homescreen.png";
import matchScreen from "../assets/matchscreen.png";
import searchDriver from "../assets/searchdriver.png";
import downloadIcon from "../assets/download.png";
import useSEO from "../hooks/useSEO";

const steps = [
  {
    title: "Download the app",
    description:
        "Get the Troski passenger app to start requesting verified rides near you.",
    image: downloadIcon,
    alt: "Troski download icon",
    dark: true, // black background with white text
  },
  {
    title: "Set your pickup and destination",
    description:
        "Tell the app where you are and where you're headed",
    image: homeScreen,
    alt: "Troski home screen",
  },
  {
    title: "Get matched with a verified driver",
    description:
        "Every driver on Troski is verified, so you know exactly who's picking you up.",
    image: matchScreen,
    alt: "Troski driver match screen",
  },
  {
    title: "Ride and pay digitally",
    description:
        "Skip the cash hassle — pay for your trip directly through the app.",
    image: searchDriver,
    alt: "Troski driver search screen",
  },
];

const HowItWorks = () => {
  useSEO({
    title: "How It Works | Troski",
    description:
        "See how Troski works — from downloading the app to getting matched with a verified driver.",
  });

  return (
      <div className="flex flex-col gap-12 pb-24 md:gap-16">

        {/* Hero Section */}
        <section className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-6 pt-12 text-center md:px-8">
          <h1 className="text-4xl font-bold md:text-5xl">
            How Troski Works
          </h1>

          <p className="text-base text-black/50 md:text-lg">
            A simple, verified way to get around — from request to ride.
          </p>
        </section>

        {/* Steps Section */}
        <section className="flex w-full justify-center">
          <div className="grid w-[90%] max-w-7xl grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-4">

            {steps.map((step) => (
                <div
                    key={step.title}
                    className={`flex h-[512px] flex-col gap-4 rounded-2xl p-6 md:p-8 lg:h-[560px] lg:p-5 xl:p-6 ${
                        step.dark ? "bg-black text-white" : "bg-brand text-black"
                    }`}
                >

                  {/* Step Image: fills the space above the text and is centered, never cropped */}
                  <div className="relative flex min-h-0 flex-1 items-center justify-center">
                    {step.image ? (
                        <img
                            src={step.image}
                            alt={step.alt}
                            loading="lazy"
                            className="absolute inset-0 h-full w-full object-contain"
                        />
                    ) : (
                        <Download
                            size={72}
                            strokeWidth={1.5}
                            className={step.dark ? "text-white/60" : "text-black/40"}
                            aria-hidden="true"
                        />
                    )}
                  </div>

                  {/* Step Details */}
                  <div className="flex shrink-0 flex-col gap-2">
                    <h3 className="text-lg font-semibold leading-tight md:text-xl lg:text-lg">
                      {step.title}
                    </h3>

                    <p className="text-sm leading-tight md:text-base lg:text-sm">
                      {step.description}
                    </p>
                  </div>
                </div>
            ))}

          </div>
        </section>
      </div>
  );
};

export default HowItWorks;