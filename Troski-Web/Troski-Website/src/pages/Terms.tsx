const Terms = () => {
  return (
    <div className="flex flex-col gap-12 pb-24">
      <section className="max-w-3xl mx-auto px-8 pt-12 text-center flex flex-col gap-4 items-center">
        <h1 className="text-5xl font-bold">Terms & Privacy</h1>
        <p className="text-lg text-gray-600">
          Please review our terms of use and privacy practices.
        </p>
      </section>

      <section className="w-full flex justify-center">
        <div className="w-[90%] md:w-[70%] flex flex-col gap-10">
          <div className="flex flex-col gap-3">
            <h2 className="text-2xl font-bold">Terms of Use</h2>
            <p className="text-gray-600">
              [Placeholder — pending legal review] By using the Troski
              website and app, you agree to use the service responsibly and
              in accordance with applicable laws.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-2xl font-bold">Privacy Policy</h2>
            <p className="text-gray-600">
              [Placeholder — pending legal review] Troski collects
              information necessary to provide and verify rides, including
              account and trip data.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Terms;