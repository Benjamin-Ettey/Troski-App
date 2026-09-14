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
  return (
    <div className="flex flex-col gap-16 pb-24">
      <section className="max-w-3xl mx-auto px-8 pt-12 text-center flex flex-col gap-4 items-center">
        <h1 className="text-5xl font-bold">How Troski Works</h1>
        <p className="text-lg text-gray-600">
          A simple, verified way to get around — from request to ride.
        </p>
      </section>

      <section className="w-full flex justify-center">
        <div className="w-[90%] md:w-[70%] grid grid-cols-1 md:grid-cols-2 gap-10">
          {steps.map((step, index) => (
            <div key={step.title} className="flex flex-col gap-2">
              <span className="text-[#ffcc00] font-bold text-2xl">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="text-xl font-semibold">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HowItWorks;