import {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { useColorScheme } from "nativewind";

type ThemeMode = "light" | "dark" | "system";

type ThemeContextType = {
    mode: ThemeMode;
    setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextType>({
    mode: "light",
    setMode: () => {},
});

export function ThemeProvider({
                                  children,
                              }: {
    children: React.ReactNode;
}) {
    const [mode, setModeState] =
        useState<ThemeMode>("light");

    const { setColorScheme, colorScheme } =
        useColorScheme();

    useEffect(() => {
        loadTheme();
    }, []);

    async function loadTheme() {
        const saved =
            (await AsyncStorage.getItem("theme")) as ThemeMode;

        if (saved) {
            applyTheme(saved);
        }
    }

    async function setMode(mode: ThemeMode) {
        await AsyncStorage.setItem("theme", mode);
        applyTheme(mode);
    }

    function applyTheme(mode: ThemeMode) {
        setModeState(mode);

        if (mode === "system") {
            setColorScheme(colorScheme === "dark" ? "dark" : "light");
        } else {
            setColorScheme(mode);
        }
    }

    return (
        <ThemeContext.Provider
            value={{
                mode,
                setMode,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}