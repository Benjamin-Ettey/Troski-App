import React, { useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import {useRouter} from "expo-router";

import PrimaryButton from "@/components/PrimaryButton";
import OtpModal from "@/components/ui/OtpModal";

import { useAppStore } from "@/utils/store";

const PinScreen = () => {
    const router = useRouter();

    const driverpin = useAppStore((state) => state.driverpin);

    const [showModal, setShowModal] = useState(false);

    const [value, setValue] = useState("");

    const [error, setError] = useState("");

    const [attempts, setAttempts] = useState(0);

    const disable = value.length !== 6;

    const handleNext = () => {

        if (value.length !== 6) {
            setError("Please enter your 6 digit PIN.");
            return;
        }


        if (value !== driverpin) {
            setAttempts((prev) => prev + 1);
            setError("Incorrect PIN. Please try again.");
            return;
        }


        setError("");


        setShowModal(true);
    };

    const handleKeyPress = (key: string) => {

        if (error) {
            setError("");
        }

        if (key === "back") {
            setValue((prev) => prev.slice(0, -1));
            return;
        }

        if (!key) return;

        if (value.length < 6) {
            setValue((prev) => prev + key);
        }
    };

    const keypad = [
        ["1", "2", "3"],
        ["4", "5", "6"],
        ["7", "8", "9"],
        ["", "0", "back"],
    ];

    return (
        <View className="flex-1  bg-general">
            <StatusBar style="dark" />

            {showModal ? (
                <OtpModal />
            ) : (
                <View className="flex-1 px-6 ">


                    <View className="w-full mb-5">
                        <Text className="text-2xl leading-7  text-black font-GoogleSansMedium tracking-tight">
                            Enter 6 digit pin
                        </Text>

                        <Text className="text-sm leading-4 mt-1 text-secondaryGray font-GoogleSansRegular">
                            Type in your 6 digit code you used during account creation.
                        </Text>
                    </View>


                    <View className="flex-row justify-between items-center w-full mb-4">
                        {[...Array(6)].map((_, index) => {
                            const filled = value[index];

                            return (
                                <View
                                    key={index}
                                    className={`
                                        w-14 h-16 rounded-2xl
                                        border
                                        items-center justify-center
                                        
                                        bg-white
                                        ${
                                        filled
                                            ? "border-green-600"
                                            : "border-tertiaryGray "
                                    }
                                    `}
                                >
                                    <Text className="text-2xl text-black font-GoogleSansMedium">
                                        {filled ? "*" : ""}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>


                    <View className="w-full mb-1">
                        <View className="flex-row items-start w-full">
                            <Ionicons
                                name="lock-closed"
                                size={12}
                                color="gray"
                            />

                            <Text
                                style={{ flexShrink: 1 }}
                                className="text-sm pl-2 leading-4 text-gray-500 font-GoogleSansRegular"
                            >
                                Do not share this PIN code with anyone.
                            </Text>
                        </View>
                    </View>


                    {error ? (
                        <View className="w-full gap-2 mb-3 flex flex-row justify-start items-center">
                            <Ionicons name="alert" size={12} color="red"/>

                            <Text className="text-red-500 text-sm font-GoogleSansRegular ">
                                {error}
                            </Text>
                        </View>

                    ) : null}




                    <View className="w-full mt-14 mb-6">
                        {keypad.map((row, rowIndex) => (
                            <View
                                key={rowIndex}
                                className="flex-row justify-center gap-8 mb-5"
                            >
                                {row.map((item, index) => {
                                    const isBackspace = item === "back";
                                    const isEmpty = item === "";

                                    return (
                                        <TouchableOpacity
                                            key={index}
                                            activeOpacity={0.7}
                                            disabled={isEmpty}
                                            onPress={() =>
                                                handleKeyPress(item)
                                            }
                                            className={`
                                                w-20 h-20 rounded-full
                                                items-center justify-center
                                                ${
                                                isEmpty
                                                    ? "bg-transparent"
                                                    : "bg-tertiaryWhite "
                                            }
                                            `}
                                        >
                                            {isBackspace ? (
                                                <Ionicons
                                                    name="backspace-outline"
                                                    size={30}
                                                    color="#000000"
                                                />
                                            ) : (
                                                <Text className="text-3xl text-black font-GoogleSansMedium">
                                                    {item}
                                                </Text>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        ))}
                    </View>

                    <View className="w-full justify-center items-center">
                        {attempts >= 3 && (
                            <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={() => router.replace("/login/forgotPin")}
                                className="mb-2 border border-secondaryBlack  px-2 py-1 rounded-full"
                            >
                                <Text className="text-secondaryBlack text-sm font-GoogleSansMedium">
                                    Forgot PIN?
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>



                    <View className="mt-auto mb-10 justify-center items-center">
                        <PrimaryButton
                            name="Next"
                            disabled={disable}
                            onPress={handleNext}
                        />
                    </View>
                </View>
            )}
        </View>
    );
};

export default PinScreen;