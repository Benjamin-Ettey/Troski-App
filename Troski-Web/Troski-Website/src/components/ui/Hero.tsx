import aerialview from "../../assets/images/aerialview.png";

const Hero = () => {
    return (
        <section
            id="Hero"
            className="relative h-[650px] w-full overflow-hidden bg-black"
        >
            {/* Background image */}
            {/*<img*/}
            {/*    src={aerialview}*/}
            {/*    alt=""*/}
            {/*    className="absolute inset-0 h-full w-full object-cover object-center"*/}
            {/*/>*/}

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/45" />

            {/* Content */}
            <div className="relative z-10 mx-auto flex h-full w-full max-w-[1536px] items-center justify-between px-6 pt-16 md:px-10 lg:px-36">

                {/* LEFT SIDE */}
                <div className="max-w-[650px]">
                    <h1 className="text-5xl font-medium leading-[0.95] tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl">
                        Move freely.
                        <br />
                        Move with Troski.
                    </h1>

                    <p className="mt-6 max-w-lg text-base font-thin leading-relaxed text-white/90 md:text-lg">
                        Wherever you're going, Troski gets you there.
                        Request a ride in just a few taps and enjoy a simple,
                        reliable way to move around.
                    </p>
                </div>


                {/* RIGHT SIDE */}
                <div className="hidden w-[350px] lg:block">

                    <div className="rounded-[28px] bg-[#F8F8F8] p-6 shadow-2xl">

                        {/* Heading */}
                        <div className="text-center">
                            <h2 className="text-2xl font-medium tracking-tight text-black">
                                Get the Troski app
                            </h2>

                        </div>


                        {/* Passenger / Driver */}
                        <div className="mt-6 grid grid-cols-2 gap-3">



                        </div>


                        {/* QR CODE */}
                        <div className="mt-4 flex items-center justify-center gap-4 rounded-2xl bg-white p-4">

                            {/* QR placeholder */}
                            <div className="flex h-[160px] w-[90%] shrink-0 items-center justify-center rounded-xl bg-black">

                            </div>


                        </div>


                        {/* APP STORE BUTTONS */}
                        <div className="mt-4 grid grid-cols-2 gap-3">

                            {/* App Store */}
                            <div className="flex h-12 items-center justify-center gap-2 px-3">



                            </div>


                            {/* Google Play */}
                            <div className="flex h-12 items-center justify-center gap-2 px-3">


                            </div>

                        </div>


                        {/* GET APP BUTTON */}
                        <button
                            type="button"
                            className="mt-4 w-full cursor-pointer rounded-full bg-[#ffcc00] py-3 text-sm font-medium text-black transition hover:bg-[#ffd633]"
                        >
                            Get the app
                        </button>

                    </div>

                </div>

            </div>
        </section>
    );
};

export default Hero;