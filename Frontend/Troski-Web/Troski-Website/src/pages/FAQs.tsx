import { useState } from "react";
import useSEO from "../hooks/useSEO";

type FAQ = {
  question: string;
  answer: string;
};

const passengerFAQs: FAQ[] = [
  {
    question: "What is Troski?",
    answer:
      "Troski is a ride-booking platform that connects passengers with verified drivers for convenient trips.",
  },
  {
    question: "Where is Troski currently available?",
    answer:
      "Troski is launching first on the KNUST campus as a controlled pilot, before expanding to towns and cities across Ghana.",
  },
  {
    question: "How do I book a ride?",
    answer:
      "Download the Troski passenger app, enter your destination, choose your trip preferences, and follow the steps to book your ride.",
  },
  {
    question: "Is it safe to ride with Troski?",
    answer:
      "Drivers go through a verification process before they are approved on the platform, helping passengers travel with greater confidence.",
  },
  {
    question: "How do I pay for my trip?",
    answer:
      "Follow the payment instructions provided in the Troski app when booking your trip. Available payment methods may depend on the options supported by the app.",
  },
  {
    question: "How do I contact Troski support?",
    answer:
      "Visit the Contact page to send us a message or reach out through the contact details listed there.",
  },
];

const driverFAQs: FAQ[] = [
  {
    question: "How do I become a Troski driver?",
    answer:
      "Visit the Become a Driver page and submit an application with your details and required documents. Our team will review your application and reach out to you.",
  },
  {
    question: "What documents do I need to apply?",
    answer:
      "You will need to provide your personal details and the required identification, driving licence, and vehicle information during the application process.",
  },
  {
    question: "How does driver verification work?",
    answer:
      "After submitting your application, our team reviews your details and supporting documents before deciding whether to approve your account.",
  },
  {
    question: "When can I start accepting trips?",
    answer:
      "You can start accepting trips once your application has been reviewed and your driver account has been approved.",
  },
  {
    question: "How do I manage my trips?",
    answer:
      "Once approved, you can use the Troski Driver app to manage your availability and access the trip features made available to drivers.",
  },
  {
    question: "How do I contact driver support?",
    answer:
      "Visit the Contact page to reach the Troski team if you need help with your application or driver account.",
  },
];

const FAQs = () => {
  useSEO({
    title: "FAQs | Troski",
    description:
      "Find answers to frequently asked questions for Troski passengers and drivers.",
  });

  const [activeTab, setActiveTab] = useState<"passengers" | "drivers">(
    "passengers"
  );
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs =
    activeTab === "passengers" ? passengerFAQs : driverFAQs;

  const handleTabChange = (tab: "passengers" | "drivers") => {
    setActiveTab(tab);
    setOpenIndex(null);
  };

  return (
    <main className="w-full px-5 md:px-10 lg:px-16 pb-24 bg-[#FAF9F6]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-10 lg:gap-16">

        {/* LEFT SIDEBAR */}
        <aside className="w-full md:w-[28%] lg:w-[30%] shrink-0">
          <div className="md:sticky md:top-28 pt-10">

            <h2 className="text-2xl md:text-xl lg:max-w-[60%] leading-none tracking-tight text-black font-semibold mb-3">
              Frequently Asked Questions (FAQs)
            </h2>

            <p className="text-sm leading-tight lg:max-w-[60%] md:text-base text-black/70 mb-8">
              Find answers and helpful information about using Troski.
            </p>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => handleTabChange("passengers")}
                className={`w-full lg:w-[60%] flex items-center justify-between gap-4 px-5 py-2 rounded-xl text-left transition-all duration-200 ${
  activeTab === "passengers"
      ? "bg-[#ffcc00] hover:bg-[#F0C000] text-black"
      : "bg-[#FAF9F6] text-gray-700 hover:bg-black/5"
}`}
              >
                <span className="flex items-center gap-3">
                  <span className="font-semibold text-black">For Passengers</span>
                </span>

              </button>

              <button
                type="button"
                onClick={() => handleTabChange("drivers")}
                className={`w-full lg:w-[60%] flex items-center justify-between gap-4 px-5 py-2 rounded-xl text-left transition-all duration-200 ${
  activeTab === "drivers"
      ? "bg-[#ffcc00] hover:bg-[#F0C000] text-black"
      : "bg-[#FAF9F6] text-gray-700 hover:bg-black/5"
}`}
              >
                <span className="flex items-center gap-3">

                  <span className="font-semibold text-black">For Drivers</span>
                </span>


              </button>
            </div>
          </div>
        </aside>

        {/* RIGHT FAQ CONTENT */}
        <section className="flex-1 min-w-0 pt-10">
          <div className="mb-10">
            <p className="text-sm font-semibold text-black/70 mb-3">
              {activeTab === "passengers"
                ? "PASSENGER SUPPORT"
                : "DRIVER SUPPORT"}
            </p>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-black tracking-tight mb-4">
              General Questions
            </h1>

            <p className="text-base md:text-lg text-black/70">
              {activeTab === "passengers"
                ? "Everything you need to know about booking and enjoying your trips with Troski."
                : "Everything you need to know about applying, getting verified, and driving with Troski."}
            </p>
          </div>

          <div className="w-full flex flex-col divide-y divide-gray-200 border-t border-b border-gray-200">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;

              return (
                <div key={faq.question} className="py-5">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() =>
                      setOpenIndex(isOpen ? null : index)
                    }
                    className="w-full flex justify-between items-center text-left gap-6 cursor-pointer"
                  >
                    <span className="text-base md:text-lg font-medium text-black">
                      {faq.question}
                    </span>

                    <span className="text-xl md:text-2xl shrink-0 text-black">
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>

                  {isOpen && (
                    <p className="mt-3 text-sm md:text-base leading-7 text-black/70 max-w-2xl">
                      {faq.answer}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* CONTACT SUPPORT */}
          <div className="mt-10 p-6 md:px-6 md:py-4 rounded-2xl bg-black/3">
            <h3 className="text-lg md:text-xl font-semibold text-black mb-2">
              Still have questions?
            </h3>

            <p className="text-sm md:text-base text-black/70 mb-5">
              Can't find the answer you're looking for? Get in touch with
              our team and we'll be happy to help.
            </p>

            <a
              href="/contact"
              className="inline-flex items-center justify-center px-5 py-2 rounded-lg bg-[#ffcc00] text-black font-semibold hover:bg-[#f2c000] transition-colors"
            >
              Contact Us <span className="ml-2">→</span>
            </a>
          </div>
        </section>
      </div>
    </main>
  );
};

export default FAQs;
