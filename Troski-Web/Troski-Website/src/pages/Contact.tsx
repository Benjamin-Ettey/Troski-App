import { useState, type ChangeEvent, type FormEvent } from "react";
import useSEO from "../hooks/useSEO";

interface ContactForm {
  name: string;
  email: string;
  message: string;
}

const initialForm: ContactForm = {
  name: "",
  email: "",
  message: "",
};

const Contact = () => {
  useSEO({
    title: "Contact Us | Troski",
    description: "Get in touch with the Troski team.",
  });

  const [form, setForm] = useState<ContactForm>(initialForm);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
      e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    // TODO: connect to backend contact endpoint once available
    console.log("Contact form submitted:", form);

    setSubmitted(true);
  };

  return (
      <main className="w-full bg-white">
        <section className="w-full max-w-[1536px] mx-auto px-6 md:px-10 lg:px-36 pt-8 md:pt-40 pb-20 md:pb-28">

          {/* Heading */}
          <div className="mb-10 md:mb-14">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight text-black">
              Get in touch
            </h1>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 mb-14 md:mb-20">

            {/* Address */}
            <div className="flex flex-col gap-2">
            <span className=" text-black/50 font-medium">
              Address:
            </span>

              <p className="font-medium leading-relaxed text-black">
                Accra, Ghana
              </p>
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-2">
            <span className="font-medium text-black/50">
              Phone:
            </span>

              <p className="font-medium text-black">
                +233 XX XXX XXXX
              </p>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-2">
            <span className="font-medium text-black/50">
              Email:
            </span>

              <p className="font-medium text-black break-words">
                support@troski.com
              </p>
            </div>

          </div>

          {/* Contact Form */}
          <div className="w-full">
            {submitted ? (
                <div className="py-10">
                  <h2 className="font-InterTight text-2xl md:text-3xl font-medium text-black mb-3">
                    Thanks for reaching out.
                  </h2>

                  <p className="text-sm md:text-base text-black/50">
                    We've received your message and will get back to you shortly.
                  </p>
                </div>
            ) : (
                <form
                    onSubmit={handleSubmit}
                    className="w-full flex flex-col gap-6 md:gap-7"
                >
                  {/* Name + Email */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">

                    {/* Name */}
                    <div className="flex flex-col gap-2">
                      <label
                          htmlFor="name"
                          className="font-medium text-black/60"
                      >
                        Your Name
                      </label>

                      <input
                          id="name"
                          name="name"
                          type="text"
                          required
                          value={form.name}
                          onChange={handleChange}
                          placeholder="Your full name"
                          className="
                      w-full
                      h-12
                      md:h-13
                      rounded-xl
                      border-0
                      bg-[#f3f3f1]
                      px-4
                      text-sm
                      md:text-base
                      text-black
                      outline-none
                      placeholder:text-black/35
                      focus:ring-1
                      focus:ring-black/20
                      transition
                    "
                      />
                    </div>

                    {/* Email */}
                    <div className="flex flex-col gap-2">
                      <label
                          htmlFor="email"
                          className="font-medium text-black/60"
                      >
                        Email address
                      </label>

                      <input
                          id="email"
                          name="email"
                          type="email"
                          required
                          value={form.email}
                          onChange={handleChange}
                          placeholder="Your email address"
                          className="
                      w-full
                      h-12
                      md:h-13
                      rounded-xl
                      border-0
                      bg-[#f3f3f1]
                      px-4
                      text-sm
                      md:text-base
                      text-black
                      outline-none
                      placeholder:text-black/35
                      focus:ring-1
                      focus:ring-black/20
                      transition
                    "
                      />
                    </div>

                  </div>

                  {/* Message */}
                  <div className="flex flex-col gap-2">
                    <label
                        htmlFor="message"
                        className="font-medium text-black/60"
                    >
                      Message
                    </label>

                    <textarea
                        id="message"
                        name="message"
                        required
                        rows={7}
                        value={form.message}
                        onChange={handleChange}
                        placeholder="Write something..."
                        className="
                    w-full
                    min-h-[180px]
                    md:min-h-[220px]
                    resize-none
                    rounded-xl
                    border-0
                    bg-[#f3f3f1]
                    px-4
                    py-4
                    text-sm
                    md:text-base
                    text-black
                    outline-none
                    placeholder:text-black/35
                    focus:ring-1
                    focus:ring-black/20
                    transition
                  "
                    />
                  </div>

                  {/* Submit */}
                  <div>
                    <button
                        type="submit"
                        className="
                    rounded-lg
                    bg-[#ffcc00]
                    px-5
                    py-2.5
                    font-bold
                    text-sm
                    text-black
                    cursor-pointer
                    transition
                    hover:bg-neutral-800
                     hover:text-white
                  "
                    >
                      Send Message
                    </button>
                  </div>
                </form>
            )}
          </div>
        </section>
      </main>
  );
};

export default Contact;