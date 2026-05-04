/** @type {import('tailwindcss').Config} */
module.exports = {
    // NOTE: Update this to include the paths to all files that contain Nativewind classes.
    content: [ "./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            fontFamily: {
                GoogleSansRegular: ["GoogleSans-Regular", "sans-serif"],
                GoogleSansBold: ["GoogleSans-Bold", "sans-serif"],
                GoogleSansMedium: ["GoogleSans-Medium", "sans-serif"],
                GoogleSansSemiBold: ["GoogleSans-SemiBold", "sans-serif"],

                PoppinsThin: ["Poppins-Thin", "sans-serif"],
                PoppinsRegular: ["Poppins-Regular", "sans-serif"],
                PoppinsBold: ["Poppins-Bold", "sans-serif"],
                PoppinsExtraBold: ["Poppins-ExtraBold", "sans-serif"],
                PoppinsExtraLight: ["Poppins-ExtraLight", "sans-serif"],
                PoppinsLight: ["Poppins-Light", "sans-serif"],
                PoppinsMedium: ["Poppins-Medium", "sans-serif"],
                PoppinsSemiBold: ["Poppins-SemiBold", "sans-serif"],
                PoppinsBlack: ["Poppins-Black", "sans-serif"],

            },


            colors: {
                general: "#ffffff",
                primary: "#ffcc00",
                secondaryBlack: "#000000",
                secondaryGray: "#444444",
                secondaryWhite: "#e4e4e4",
                tertiaryWhite: "#f0f0f0",
                tertiaryGray: "#a9a9a9",



            },

        },
    },
    plugins: [],
}