import aerial from "../assets/aerialviewimage.png";
import useSEO from "../hooks/useSEO";

const About = () => {
  useSEO({
    title: "About Us | Troski",
    description:
      "Learn about Troski's mission to modernize tro-tro transport in Ghana, starting with a pilot at KNUST.",
  });

  return (
    <div className="flex flex-col gap-16 md:gap-24 pb-24">
      {/* Intro */}
      <section className="max-w-3xl mx-auto px-6 md:px-8 pt-12 text-center flex flex-col gap-4 items-center">
        <h1 className="text-4xl md:text-5xl font-bold">About Troski</h1>
        <p className="text-base md:text-lg text-gray-600">
          Troski is a scalable transport coordination and verification
          platform, built to digitize high-frequency informal transport
          systems in Ghana and other emerging markets.
        </p>
      </section>

      {/* Vision */}
      <section className="w-full flex justify-center">
        <div className="w-[90%] md:w-[70%] grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-center">
          <div className="flex flex-col gap-3 md:gap-4">
            <h2 className="text-2xl md:text-3xl font-bold">Our Vision</h2>
            <p className="text-sm md:text-base text-gray-600">
              Troski is not just a campus transport app. It's a platform
              designed to modernize the tro-tro experience through digital
              booking, payments, and trip verification — bringing structure
              and trust to a system millions rely on every day.
            </p>
          </div>
          <img
            src={aerial}
            alt="Aerial view of a Ghanaian road network"
            className="rounded-2xl w-full h-48 md:h-64 object-cover"
          />
        </div>
      </section>

      {/* Starting Point */}
      <section className="w-full flex justify-center">
        <div className="w-[90%] md:w-[70%] flex flex-col gap-3 md:gap-4 items-start">
          <h2 className="text-2xl md:text-3xl font-bold">Starting at KNUST</h2>
          <p className="text-sm md:text-base text-gray-600 max-w-2xl">
            The KNUST campus serves as our first controlled deployment
            environment — a real-world proving ground where we validate the
            platform's reliability, safety, and usability before expanding
            to towns and cities across Ghana and beyond.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="w-full flex justify-center">
        <div className="w-[90%] md:w-[70%] grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <div className="flex flex-col gap-2">
            <h3 className="text-lg md:text-xl font-semibold">Trust</h3>
            <p className="text-gray-600 text-sm">
              Every trip is verified, so passengers and drivers know exactly
              who they're riding with.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-lg md:text-xl font-semibold">Accessibility</h3>
            <p className="text-gray-600 text-sm">
              Built for the transport systems people already use, not to
              replace them — just make them safer and easier.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-lg md:text-xl font-semibold">Growth</h3>
            <p className="text-gray-600 text-sm">
              Designed from day one to scale beyond campus, into cities and
              markets across the region.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;