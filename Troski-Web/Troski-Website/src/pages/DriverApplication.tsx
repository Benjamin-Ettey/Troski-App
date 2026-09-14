import { useState, type ChangeEvent, type FormEvent } from "react";

interface DriverApplicationForm {
  fullName: string;
  phone: string;
  email: string;
  vehicleRegistration: string;
  licenseNumber: string;
}

const initialForm: DriverApplicationForm = {
  fullName: "",
  phone: "",
  email: "",
  vehicleRegistration: "",
  licenseNumber: "",
};

const DriverApplication = () => {
  const [form, setForm] = useState<DriverApplicationForm>(initialForm);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // TODO: connect to backend driver-application endpoint once available
    console.log("Driver application submitted:", form);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto px-8 pt-24 pb-24 text-center flex flex-col gap-4 items-center">
        <h1 className="text-4xl font-bold">Application Received</h1>
        <p className="text-gray-600">
          Thanks for applying to drive with Troski. Our team will review your
          application and get back to you soon.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-12 pb-24">
      <section className="max-w-3xl mx-auto px-8 pt-12 text-center flex flex-col gap-4 items-center">
        <h1 className="text-5xl font-bold">Driver Application</h1>
        <p className="text-lg text-gray-600">
          Fill in your details below to apply to become a Troski driver.
        </p>
      </section>

      <section className="w-full flex justify-center">
        <form
          onSubmit={handleSubmit}
          className="w-[90%] md:w-[50%] flex flex-col gap-6"
        >
          <div className="flex flex-col gap-2">
            <label htmlFor="fullName" className="font-medium">Full Name</label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              value={form.fullName}
              onChange={handleChange}
              className="border border-gray-300 rounded-lg px-4 py-2"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="phone" className="font-medium">Phone Number</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              value={form.phone}
              onChange={handleChange}
              className="border border-gray-300 rounded-lg px-4 py-2"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="font-medium">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
              className="border border-gray-300 rounded-lg px-4 py-2"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="vehicleRegistration" className="font-medium">
              Vehicle Registration Number
            </label>
            <input
              id="vehicleRegistration"
              name="vehicleRegistration"
              type="text"
              required
              value={form.vehicleRegistration}
              onChange={handleChange}
              className="border border-gray-300 rounded-lg px-4 py-2"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="licenseNumber" className="font-medium">
              Driver's License Number
            </label>
            <input
              id="licenseNumber"
              name="licenseNumber"
              type="text"
              required
              value={form.licenseNumber}
              onChange={handleChange}
              className="border border-gray-300 rounded-lg px-4 py-2"
            />
          </div>

          <button
            type="submit"
            className="bg-[#ffcc00] font-medium text-base cursor-pointer px-6 py-3 rounded-full self-start"
          >
            Submit Application
          </button>
        </form>
      </section>
    </div>
  );
};

export default DriverApplication;