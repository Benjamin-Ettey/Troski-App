import { Link } from "react-router-dom";
import useSEO from "../hooks/useSEO";

const benefits = [
  "Earn income on your own schedule",
  "Get verified and build trust with passengers",
  "Access digital payments — no more cash handling",
  "Join a growing, structured transport network",
];

const BecomeDriver = () => {
  useSEO({
    title: "Become a Driver | Troski",
    description:
      "Join Troski's verified driver network. Learn about the benefits and how to apply.",
  });

  return (
    <div className="flex flex-col gap-12 md:gap-16 pb-24">
      <section className="max-w-3xl mx-auto px-6 md:px-8 pt-12 text-center flex flex-col gap-4 items-center">
        <h1 className="text-4xl md:text-5xl font-bold">Become a Troski Driver</h1>
        <p className="text-base md:text-lg text-gray-600">
          Join a verified network of drivers and be part of modernizing
          transport in Ghana.
        </p>
        <Link
          to="/become-a-driver/apply"
          className="mt-2 bg-[#ffcc00] font-medium text-base cursor-pointer px-6 py-3 rounded-full"
        >
          Apply Now
        </Link>
      </section>

      <section className="w-full flex justify-center">
        <div className="w-[90%] md:w-[70%] flex flex-col gap-4">
          <h2 className="text-2xl md:text-3xl font-bold">Why drive with Troski?</h2>
          <ul className="flex flex-col gap-3">
            {benefits.map((benefit) => (
              <li
                key={benefit}
                className="flex items-start gap-3 text-sm md:text-base text-gray-600"
              >
                <span className="text-[#ffcc00] font-bold">✓</span>
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
};

export default BecomeDriver;