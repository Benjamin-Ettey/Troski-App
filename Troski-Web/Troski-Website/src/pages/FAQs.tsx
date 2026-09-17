import { useState } from "react";
import useSEO from "../hooks/useSEO";

const faqs = [
  {
    question: "Is Troski a ride-booking app?",
    answer:
      "No. This website is for learning about Troski and applying to become a driver. Booking rides happens through the Troski mobile app.",
  },
  {
    question: "Where is Troski currently available?",
    answer:
      "Troski is launching first on the KNUST campus as a controlled pilot, before expanding to towns and cities across Ghana.",
  },
  {
    question: "How do I become a Troski driver?",
    answer:
      "Visit the Become a Driver page and submit an application with your details and required documents. Our team will review and reach out to you.",
  },
  {
    question: "Is it safe to ride with Troski?",
    answer:
      "Every driver on the platform goes through a verification process before they're approved, so passengers know exactly who they're riding with.",
  },
  {
    question: "How do I contact Troski support?",
    answer:
      "Head to the Contact page to send us a message, or reach us through the details listed there.",
  },
];

const FAQs = () => {
  useSEO({
    title: "FAQs | Troski",
    description:
      "Answers to frequently asked questions about Troski.",
  });

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-10 md:gap-12 pb-24">
      <section className="max-w-3xl mx-auto px-6 md:px-8 pt-12 text-center flex flex-col gap-4 items-center">
        <h1 className="text-4xl md:text-5xl font-bold">
          Frequently Asked Questions
        </h1>
        <p className="text-base md:text-lg text-gray-600">
          Answers to the questions we get asked most.
        </p>
      </section>

      <section className="w-full flex justify-center">
        <div className="w-[90%] md:w-[70%] flex flex-col divide-y divide-gray-200 border-t border-b border-gray-200">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={faq.question} className="py-4">
                <button
                  className="w-full flex justify-between items-center text-left cursor-pointer gap-4"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                >
                  <span className="text-base md:text-lg font-medium">
                    {faq.question}
                  </span>
                  <span className="text-xl md:text-2xl shrink-0">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
                {isOpen && (
                  <p className="mt-2 text-sm md:text-base text-gray-600 max-w-2xl">
                    {faq.answer}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default FAQs;