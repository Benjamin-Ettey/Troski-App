import { useState, type ChangeEvent, type FormEvent } from "react";
import useSEO from "../hooks/useSEO";

interface ContactForm {
  name: string;
  email: string;
  message: string;
}

const initialForm: ContactForm = { name: "", email: "", message: "" };

const Contact = () => {
  useSEO({
    title: "Contact Us | Troski",
    description:
      "Get in touch with the Troski team.",
  });

  const [form, setForm] = useState<ContactForm>(initialForm);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // TODO: connect to backend contact endpoint once available
    console.log("Contact form submitted:", form);
    setSubmitted(true);
  };

  return (
    <div className="flex flex-col gap-10 md:gap-12 pb-24">
      <section className="max-w-3xl mx-auto px-6 md:px-8 pt-12 text-center flex flex-col gap-4 items-center">
        <h1 className="text-4xl md:text-5xl font-bold">Contact Us</h1>
        <p className="text-base md:text-lg text-gray-600">
          Have a question or want to reach out? Send us a message.
        </p>
      </section>

      <section className="w-full flex justify-center">
        <div className="w-[90%] md:w-[70%] grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 md:gap-6">
            {submitted ? (
              <p className="text-sm md:text-base text-gray-600">
                Thanks for reaching out — we'll get back to you shortly.
              </p>
            ) : (
              <>
                <div className="flex flex-col gap-2">
                  <label htmlFor="name" className="text-sm md:text-base font-medium">
                    Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={form.name}
                    onChange={handleChange}
                    className="border border-gray-300 rounded-lg px-4 py-2 text-sm md:text-base"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="email" className="text-sm md:text-base font-medium">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    className="border border-gray-300 rounded-lg px-4 py-2 text-sm md:text-base"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="message" className="text-sm md:text-base font-medium">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    value={form.message}
                    onChange={handleChange}
                    className="border border-gray-300 rounded-lg px-4 py-2 text-sm md:text-base"
                  />
                </div>

                <button
                  type="submit"
                  className="bg-[#ffcc00] font-medium text-sm md:text-base cursor-pointer px-6 py-3 rounded-full self-start"
                >
                  Send Message
                </button>
              </>
            )}
          </form>

          <div className="flex flex-col gap-3 md:gap-4">
            <h2 className="text-xl md:text-2xl font-bold">Get in touch</h2>
            <p className="text-sm md:text-base text-gray-600">
              [Company address — placeholder]
            </p>
            <p className="text-sm md:text-base text-gray-600">
              [support email — placeholder]
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;