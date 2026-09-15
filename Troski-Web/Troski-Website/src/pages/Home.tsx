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
      className="relative min-h-[600px] md:min-h-[750px] overflow-hidden"
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${aerial})`,
        }}
      />

      <div className="relative z-10 h-full w-full flex-col gap-4 flex justify-center items-start max-w-3xl mx-auto px-6 md:px-8 py-24">
        <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
          Troski in Ghana
        </h1>
        <p className="text-white max-w-sm text-sm md:text-base">
          Wherever you are in Ghana, count on Troski for rides in minutes!
          From Tech Junction to Ayeduase, from Kasoa to Madina, Troski is only
          a tap of a button away.
        </p>

        <div className="mt-4 flex justify-center items-center">
          <button className="flex bg-[#ffcc00] font-medium text-base cursor-pointer justify-center items-center px-4 py-2 rounded-full">
            Get app
          </button>
        </div>
      </div>
    </section>
  );
};

export default Home;