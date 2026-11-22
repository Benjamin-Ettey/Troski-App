import { useState, type ChangeEvent, type FormEvent } from "react";
import useSEO from "../hooks/useSEO";
import telephone from "../assets/telephone.png";

interface ContactForm {
    name: string;
    email: string;
    message: string;
}

const initialForm: ContactForm = { name: "", email: "", message: "" };

const MESSAGE_MAX_LENGTH = 500;

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
                <p className="text-base md:text-lg text-black/50">
                    Have a question or want to reach out? Send us a message.
                </p>
            </section>

            <section className="w-full flex justify-center">
                <div className="w-[90%] md:w-[70%] max-w-xl mx-auto flex justify-center">
                    <form
                        onSubmit={handleSubmit}
                        className="w-full flex flex-col gap-5 md:gap-6 p-6"
                    >
                        {submitted ? (
                            <p className="text-sm md:text-base text-gray-600 text-center">
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
                                        autoCapitalize="sentences"
                                        placeholder="Franklin Smith"
                                        value={form.name}
                                        onChange={handleChange}
                                        className="border border-gray-300 rounded-lg px-4 py-2 text-sm md:text-base [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0_1000px_#FFF2CC_inset]
  [&:-webkit-autofill]:[-webkit-text-fill-color:#000000]"
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
                                        placeholder="franksmith@gmail.com"
                                        value={form.email}
                                        onChange={handleChange}
                                        className="border border-gray-300 rounded-lg px-4 py-2 text-sm md:text-base [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0_1000px_#FFF2CC_inset]
  [&:-webkit-autofill]:[-webkit-text-fill-color:#000000]"
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
                                        placeholder="What would you like to say?"
                                        rows={5}
                                        maxLength={MESSAGE_MAX_LENGTH}
                                        value={form.message}
                                        onChange={handleChange}
                                        className="border border-gray-300 rounded-lg px-4 py-2 text-sm md:text-base "
                                    />
                                    <p className="text-xs md:text-sm text-gray-500 text-right">
                                        {form.message.length} / {MESSAGE_MAX_LENGTH}
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    className="bg-brand font-medium text-sm md:text-base cursor-pointer px-5 py-2 rounded-lg self-start"
                                >
                                    Send Message
                                </button>
                            </>
                        )}
                    </form>

                </div>


            </section>

            <section className="w-full flex justify-center items-center mt-16">

                <div className="w-[90%] h-[512px] flex flex-row bg-brand">
                    <div className="w-full flex-1 ">
                        <img
                            src={telephone}
                            alt="Telephone"
                            className="w-full h-full object-contain object-right"
                        />
                    </div>

                    <div className="w-full flex-1 flex flex-col justify-center gap-4 md:gap-5 p-8 md:p-12">
                        <h2 className="text-2xl md:text-3xl font-bold text-black">Prefer to talk?</h2>

                        <p className="text-sm md:text-base text-black">
                            Give us a call and we'll help you straight away. <br/>We're available
                            Monday to Friday, 8am to 5pm.
                        </p>

                        <div className="flex flex-col gap-1 text-sm md:text-base">
                            <a href="tel:+233000000000" className="font-medium text-black">
                                +233 00 000 0000
                            </a>
                            <a href="mailto:support@troski.com" className="text-black">
                                support@troski.com
                            </a>
                        </div>

                        <a
                            href="tel:+233000000000"
                            className="bg-black font-medium text-brand text-sm md:text-base px-5 py-2 rounded-lg self-start"
                        >
                            Call us
                        </a>
                    </div>
                </div>
            </section>

        </div>
    );
};

export default Contact;