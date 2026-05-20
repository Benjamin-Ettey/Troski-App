import {Modal, Pressable, Text, TouchableOpacity, View} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/context/themeContext";
import {useColorScheme} from "nativewind";

type Props = {
    showTheme: boolean;
    setShowTheme: (value: boolean) => void;
};

function ThemeModal({
                        showTheme,
                        setShowTheme,
                    }: Props) {

    const { mode, setMode } = useTheme();
    const { colorScheme } = useColorScheme();

    function handleThemeChange(
        selectedMode: "light" | "dark" | "system"
    ) {

        setMode(selectedMode);


        setShowTheme(false);
    }


    return (
        <Modal
            visible={showTheme}
            transparent
            animationType="fade"
            onRequestClose={() => setShowTheme(false)}
        >

            <Pressable
                onPress={()=>setShowTheme(false)}
                style={{
                    flex: 1,
                    backgroundColor: "rgba(0,0,0,0.5)",
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >

                <View className="w-[80%] h-60 bg-general dark:bg-secondaryBlack rounded-3xl flex-col gap-2 justify-center p-4">

                    <View className="w-full flex flex-row justify-start items-center p-5">
                        <Text className="text-xl leading-5 font-GoogleSansMedium text-secondaryBlack dark:text-general">Choose theme</Text>
                    </View>


                    <TouchableOpacity
                        onPress={() => handleThemeChange("light")}
                        className="w-full h-12 flex flex-col px-5"
                    >
                        <View className="flex-row justify-between items-center mb-2">
                            <Text className="text-lg leading-5 text-secondaryBlack dark:text-general font-GoogleSansRegular">
                                Light
                            </Text>

                            <Ionicons
                                name={
                                    mode === "light"
                                        ? "radio-button-on"
                                        : "radio-button-off"
                                }
                                size={24}
                                color={colorScheme === "dark"? "#ffcc00" : "black"}
                            />
                        </View>


                    </TouchableOpacity>


                    <TouchableOpacity
                        onPress={() => handleThemeChange("dark")}
                        className="w-full h-12 flex flex-col px-5"
                    >
                        <View className="flex-row justify-between items-center mb-2">
                            <Text className="text-lg leading-5 text-secondaryBlack dark:text-general font-GoogleSansRegular">
                                Dark
                            </Text>

                            <Ionicons
                                name={
                                    mode === "dark"
                                        ? "radio-button-on"
                                        : "radio-button-off"
                                }
                                size={24}
                                color={colorScheme === "dark"? "#ffcc00" : "black"}
                            />
                        </View>


                    </TouchableOpacity>


                    <TouchableOpacity
                        onPress={() => handleThemeChange("system")}
                        className="w-full  flex-row justify-between items-center px-5 mb-4"
                    >
                        <Text className="text-lg leading-5 text-secondaryBlack dark:text-general font-GoogleSansRegular">
                            System
                        </Text>

                        <Ionicons
                            name={
                                mode === "system"
                                    ? "radio-button-on"
                                    : "radio-button-off"
                            }
                            size={24}
                            color={colorScheme === "dark"? "#ffcc00" : "black"}

                        />
                    </TouchableOpacity>

                </View>

            </Pressable>

        </Modal>
    );
}

export default ThemeModal;