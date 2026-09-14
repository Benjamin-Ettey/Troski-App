import aerial from "../assets/aerialviewimage.png";

const Home = () => {
  return (
    <section id="Hero" className="relative">
      <div
        className="absolute top-0 left-0 w-full h-[750px] z-[-1] bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${aerial})`,
        }}
      />

      <div className="h-120 w-full flex-col gap-4 flex justify-center items-start max-w-3xl mx-auto px-8">
        <h1 className="text-6xl font-bold text-white">Troski in Ghana</h1>
        <p className="text-white max-w-sm">
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