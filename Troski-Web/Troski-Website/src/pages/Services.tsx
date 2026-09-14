const services = [
  {
    title: "Verified Tro-tro Rides",
    description:
      "Every driver goes through a verification process, bringing trust and accountability to everyday transport.",
  },
  {
    title: "Digital Payments",
    description:
      "Pay for trips digitally instead of relying on cash, making every ride faster and easier to track.",
  },
  {
    title: "Trip Verification",
    description:
      "Trips are logged and verifiable, giving passengers and drivers a clear, trustworthy record of every journey.",
  },
  {
    title: "Driver Network",
    description:
      "A growing network of verified drivers ready to serve high-frequency routes across campus and beyond.",
  },
];

const Services = () => {
  return (
    <div className="flex flex-col gap-16 pb-24">
      <section className="max-w-3xl mx-auto px-8 pt-12 text-center flex flex-col gap-4 items-center">
        <h1 className="text-5xl font-bold">Our Services</h1>
        <p className="text-lg text-gray-600">
          What Troski brings to everyday transport.
        </p>
      </section>

      <section className="w-full flex justify-center">
        <div className="w-[90%] md:w-[70%] grid grid-cols-1 md:grid-cols-2 gap-8">
          {services.map((service) => (
            <div
              key={service.title}
              className="flex flex-col gap-2 p-6 rounded-2xl border border-gray-200"
            >
              <h3 className="text-xl font-semibold">{service.title}</h3>
              <p className="text-gray-600">{service.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Services;