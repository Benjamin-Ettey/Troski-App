import aerial from "../assets/aerialviewimage.png";
import useSEO from "../hooks/useSEO";

const Home = () => {
  useSEO({
    title: "Troski | Verified Rides in Ghana",
    description:
      "Troski is a scalable transport platform modernizing tro-tro transport in Ghana with digital booking, payments, and trip verification.",
  });

  return (
    <section
      id="Hero"
      className="relative min-h-[600px] overflow-hidden md:min-h-[750px]"
    >
      <div
        className="absolute inset-0 animate-hero-zoom bg-cover bg-center motion-reduce:animate-none"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${aerial})`,
        }}
      />

      <div className="relative z-10 mx-auto flex h-full w-full max-w-3xl flex-col items-start justify-center gap-4 px-6 py-24 md:px-8">
        <h1 className="animate-fade-up text-4xl font-bold leading-tight text-white motion-reduce:animate-none md:text-6xl">
          Troski in Ghana
        </h1>

        <p
          className="max-w-sm animate-fade-up text-sm text-white motion-reduce:animate-none md:text-base"
          style={{ animationDelay: "150ms" }}
        >
          Wherever you are in Ghana, count on Troski for rides in minutes!
          From Tech Junction to Ayeduase, from Kasoa to Madina, Troski is only
          a tap of a button away.
        </p>

        <div
          className="mt-4 animate-fade-up motion-reduce:animate-none"
          style={{ animationDelay: "300ms" }}
        >
          <button className="flex cursor-pointer items-center justify-center rounded-full bg-brand px-5 py-2.5 text-base font-semibold text-ink transition duration-300 hover:-translate-y-0.5 hover:bg-brand-dark active:scale-95">
            Get app
          </button>
        </div>
      </div>
    </section>
  );
};

export default Home;