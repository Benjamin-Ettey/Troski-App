import useSEO from "../hooks/useSEO";
import verifiedIcon from "../assets/verifiedicon.png";
import paymentsIcon from "../assets/cash.png";
import clipboardIcon from "../assets/clipboard.png";
import driverNetworkIcon from "../assets/drivernetwork.png";

const services = [
  {
    title: "Verified Tro-Tro Rides",
    description:
        "Every driver goes through a verification process, bringing trust and accountability to everyday transport.",
    icon: verifiedIcon,
  },
  {
    title: "Digital Payments",
    description:
        "Pay for trips digitally instead of relying on cash, making every ride faster and easier to track.",
    icon: paymentsIcon,
  },
  {
    title: "Trip Verification",
    description:
        "Trips are logged and verifiable, giving passengers and drivers a clear, trustworthy record of every journey.",
    icon: clipboardIcon,
  },
  {
    title: "Driver Network",
    description:
        "A growing network of verified drivers ready to serve high-frequency routes across campus and beyond.",
    icon: driverNetworkIcon,
  },
];

const Services = () => {
  useSEO({
    title: "Our Services | Troski",
    description:
        "Explore Troski's services: verified rides, digital payments, trip verification, and a growing driver network.",
  });

  return (
      <div className="flex flex-col gap-12 md:gap-16 pb-24">
        <section className="max-w-3xl mx-auto px-6 md:px-8 pt-12 text-center flex flex-col gap-4 items-center">
          <h1 className="text-4xl md:text-5xl font-bold">Our Services</h1>
          <p className="text-base md:text-lg text-black/50">
            What Troski brings to everyday transport.
          </p>
        </section>

        <section className="w-full flex justify-center">
          <div className="w-[90%] md:w-[85%] max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {services.map((service) => (
                <div
                    key={service.title}
                    className="flex flex-col h-full gap-4 p-5 md:p-6 rounded-2xl bg-brand transition duration-300 hover:-translate-y-1 "
                >
                  <div className="flex items-center justify-start rounded-xl mb-4">
                    <img
                        src={service.icon}
                        alt=""
                        className="w-32 h-32 object-contain"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <h3 className="text-lg md:text-xl font-semibold">
                      {service.title}
                    </h3>
                    <p className="text-sm md:text-base text-black/70">
                      {service.description}
                    </p>
                  </div>
                </div>
            ))}
          </div>
        </section>
      </div>
  );
};

export default Services;