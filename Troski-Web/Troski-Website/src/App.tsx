import logo from "./assets/logo.svg"
import aerial from "./assets/aerialviewimage.png"

const App = () => {
    return (
        <>

            <section id="NavBar" className="flex justify-center">
                <div className="w-[95%] md:w-[70%] mt-4 md:mt-8 flex flex-row items-center justify-between">
                    <div className="w-24 h-10 flex items-center justify-center">
                        <img src={logo} alt="Troski Logo" width={96} height={64}/>
                    </div>

                    <div className="w-64 h-10  flex flex-row md:justify-between justify-end items-center gap-2">

                        <button className="hidden md:flex hover:bg-white bg-[#ffcc00]  font-medium text-base cursor-pointer justify-center items-center px-4 py-2 rounded-full">
                            Become a driver
                        </button>

                        <button className="flex flex-col gap-2">

                            <div className="w-8 h-0.5 bg-white"/>
                            <div className="w-8 h-0.5 bg-white"/>

                        </button>
                        <div>

                        </div>
                    </div>
                </div>
            </section>


            <section id="Hero">

                <div
                    className="w-full absolute top-0 z-[-1] h-[750px] bg-cover bg-center"
                    style={{ backgroundImage: `url(${aerial})` }}
                >

                </div>

                <div className="w-full absolute z-[-1] top-0 bg-black opacity-50 h-[750px] bg-cover bg-center"/>


                <div className="h-120 w-full flex-col px-8 gap-4 md:px-80 flex justify-center items-start">

                    <p className="text-6xl font-bold text-white ">Troski in Ghana</p>
                    <p className="text-white max-w-sm">Wherever you are in Ghana, count on Troski for rides in minutes! From Tech Junction to Ayeduase, from Kasoa to Madina, Troski is only a tap of a button away.</p>

                    <div className="mt-4 flex justify-center items-center">
                        <button className="flex bg-[#ffcc00]  font-medium text-base cursor-pointer justify-center items-center px-4 py-2 rounded-full">
                            Get app
                        </button>
                    </div>
                </div>

            </section>

        </>
    )
}
export default App
