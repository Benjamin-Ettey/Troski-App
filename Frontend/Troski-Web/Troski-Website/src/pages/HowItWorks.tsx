
import useSEO from "../hooks/useSEO";

const steps = [
  {
    title: "Download the app",
    description:
        "Get the Troski passenger app to start requesting verified rides near you.",
  },
  {
    title: "Set your pickup and destination",
    description:
        "Tell the app where you are and where you're headed — from Tech Junction to Ayeduase, and beyond.",
  },
  {
    title: "Get matched with a verified driver",
    description:
        "Every driver on Troski is verified, so you know exactly who's picking you up.",
  },
  {
    title: "Ride and pay digitally",
    description:
        "Skip the cash hassle — pay for your trip directly through the app.",
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
          <div className="grid w-[90%] max-w-5xl grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">

            {steps.map((step, index) => (
                <div
                    key={step.title}
                    className="flex h-[512px] flex-col gap-4 rounded-2xl bg-black/10 p-6  md:p-8"
                >


                  {/* Step Details */}
                  <div className="flex flex-col gap-2">
                    <h3 className="text-lg font-semibold text-black md:text-xl">
                      {step.title}
                    </h3>

                    <p className="text-sm leading-relaxed text-black md:text-base">
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
