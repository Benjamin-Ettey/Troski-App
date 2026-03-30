/** @type {import('tailwindcss').Config} */
module.exports = {
    // NOTE: Update this to include the paths to all files that contain Nativewind classes.
    content: [ "./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            fontFamily: {
                ManropeRegular: ["Manrope-Regular", "sans-serif"],
                ManropeBold: ["Manrope-Bold", "sans-serif"],
                ManropeExtraBold: ["Manrope-ExtraBold", "sans-serif"],
                ManropeExtraLight: ["Manrope-ExtraLight", "sans-serif"],
                ManropeLight: ["Manrope-Light", "sans-serif"],
                ManropeMedium: ["Manrope-Medium", "sans-serif"],
                ManropeSemiBold: ["Manrope-SemiBold", "sans-serif"],

                InterThin: ["Inter_18pt-Thin", "sans-serif"],
                InterRegular: ["Inter_18pt-Regular", "sans-serif"],
                InterBold: ["Inter_18pt-Bold", "sans-serif"],
                InterExtraBold: ["Inter_18pt-ExtraBold", "sans-serif"],
                InterExtraLight: ["Inter_18pt-ExtraLight", "sans-serif"],
                InterLight: ["Inter_18pt-Light", "sans-serif"],
                InterMedium: ["Inter_18pt-Medium", "sans-serif"],
                InterSemiBold: ["Inter_18pt-SemiBold", "sans-serif"],
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