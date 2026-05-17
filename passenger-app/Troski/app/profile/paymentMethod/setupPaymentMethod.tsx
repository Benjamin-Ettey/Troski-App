import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Image,
} from 'react-native'
import React, { useState } from 'react'
import {
    KeyboardAwareScrollView,
    KeyboardToolbar
} from "react-native-keyboard-controller";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import PrimaryButton from "@/components/PrimaryButton";
import { useAppStore } from "@/utils/store";
import { Ionicons } from "@expo/vector-icons";
import {useColorScheme} from "nativewind";

const SetupPaymentMethod = () => {

    const [selectedValue, setSelectedValue] =
        useState("Select service provider");

    const [open, setOpen] = useState(false);

    const [value, setValue] = useState('');
    const [error, setError] = useState('');
    const [providerError, setProviderError] = useState('');
    const { colorScheme } = useColorScheme();


    const setNumber = useAppStore((state) => state.setNumber);
    const setServiceProvider = useAppStore((state) => state.setServiceProvider);

    const addPaymentMethod = useAppStore((state) => state.addPaymentMethod);

    const validate = (text: string) => {
        const cleaned = text.replace(/[^0-9]/g, '');
        setValue(cleaned);

        if (cleaned.length === 0) {
            setError('');
        } else if (cleaned.length !== 10) {
            setError('Number must be exactly 10 digits');
        } else {
            setError('');
        }
    };

    const getProviderLogo = (provider: string) => {
        switch (provider?.toLowerCase()) {

            case "mtn":
                return require("../../../assets/images/mtnlogo.png");

            case "telecel":
                return require("../../../assets/images/telecellogo.png");

            case "airtel/tigo":
            case "airteltigo":
            case "airtel tigo":
                return require("../../../assets/images/airteltigologo.png");

            default:
                return require("../../../assets/images/mtnlogo.png");
        }
    };

    const handleSetup = () => {

        if (selectedValue === "Select service provider") {
            setProviderError("Please select a service provider");
            return;
        }

        if (value.length !== 10) {
            setError('Enter a valid 10-digit number');
            return;
        }

        addPaymentMethod({
            number: value,
            provider: selectedValue,
        });

        router.back();
    };

    return (
        <View
            style={{ backgroundColor: colorScheme === "dark"? "#000000" : "#F5F7FA", flex: 1 }}
            className="w-full"
        >
            <KeyboardAwareScrollView
                keyboardShouldPersistTaps="handled"
                className="flex-1"
            >

                <StatusBar style="auto" />

                <View className="w-full flex-1 flex items-center px-6">

                    {/* SERVICE PROVIDER */}
                    <View className="w-full py-2">
                        <Text className="text-xl tracking-tight font-GoogleSansMedium dark:text-general">
                            Select Service Provider
                        </Text>
                    </View>

                    <TouchableOpacity
                        onPress={() => setOpen(!open)}
                        style={{
                            paddingHorizontal: 16,
                            height: 48,
                            marginBottom: 6,
                        }}
                        className="mb-1 flex flex-row justify-between items-center font-GoogleSansRegular text-secondaryGray w-full dark:border-tertiaryGray border border-green-600/40 rounded-xl"
                    >

                        <View
                            className="flex flex-row items-center"
                            style={{ gap: 12 }}
                        >

                            {selectedValue !== "Select service provider" && (
                                <View
                                    style={{
                                        width: 32,
                                        height: 32,
                                        overflow: "hidden",
                                    }}
                                    className="rounded-full"
                                >
                                    <Image
                                        source={getProviderLogo(selectedValue)}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                        }}
                                        resizeMode="cover"
                                    />
                                </View>
                            )}

                            <Text className="font-GoogleSansMedium dark:text-tertiaryGray">{selectedValue}</Text>
                        </View>

                        {open?
                            <Ionicons
                                name="chevron-up"
                                size={16}
                                color={colorScheme === "dark"?"#ffffff":"black"}
                            />
                            :
                            <Ionicons
                                name="chevron-down"
                                size={16}
                                color={colorScheme === "dark"?"#ffffff":"black"}
                            />
                        }

                    </TouchableOpacity>

                    {providerError ? (
                        <View className="w-full items-start mb-3">
                            <Text className="text-sm font-GoogleSansMedium text-red-600">
                                {providerError}
                            </Text>
                        </View>
                    ) : null}

                    {open && (
                        <View
                            style={{
                                marginBottom: 10,
                                paddingVertical: 8,
                                paddingHorizontal: 16,
                                backgroundColor: "#a9a9a922"
                            }}
                            className="w-full gap-2 border-tertiaryGray border font-GoogleSansMedium rounded-xl"
                        >

                            {["MTN", "Telecel", "Airtel/Tigo"].map((item) => (

                                <TouchableOpacity
                                    key={item}
                                    onPress={() => {
                                        setSelectedValue(item);
                                        setProviderError('');
                                        setOpen(false);
                                    }}
                                    style={{
                                        padding: 6,
                                    }}
                                    className="w-full flex flex-row items-center rounded-xl"
                                >

                                    <View
                                        style={{
                                            width: 32,
                                            height: 32,
                                            overflow: "hidden",
                                            marginRight: 12,
                                        }}
                                        className="rounded-full"
                                    >
                                        <Image
                                            source={getProviderLogo(item)}
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                            }}
                                            resizeMode="cover"
                                        />
                                    </View>

                                    <Text className="font-GoogleSansRegular text-xl dark:text-tertiaryGray">
                                        {item}
                                    </Text>

                                </TouchableOpacity>

                            ))}

                        </View>
                    )}

                    {/* PHONE NUMBER */}
                    <View className="w-full py-2">
                        <Text className="text-xl tracking-tight font-GoogleSansMedium dark:text-general">
                            Phone number
                        </Text>
                    </View>

                    <TextInput
                        maxLength={10}
                        value={value}
                        onChangeText={validate}
                        autoCorrect={false}
                        autoCapitalize="none"
                        keyboardType="phone-pad"
                        autoFocus={true}
                        style={{ paddingLeft: 16, height: 48 }}
                        className="mb-1 font-medium dark:text-general text-secondaryGray w-full py-4 border border-tertiaryGray rounded-xl dark:focus:border-tertiaryGray focus:border focus:border-green-600/40"
                    />

                    {error ? (
                        <View className="mb-6 w-full items-start">
                            <Text className="text-sm font-GoogleSansMedium text-red-600">
                                {error}
                            </Text>
                        </View>
                    ) : (
                        <View className="mb-6 w-full items-start">
                            <Text className="text-sm font-GoogleSansRegular dark:text-tertiaryGray">
                                This number will be used for payment transactions.
                            </Text>
                        </View>
                    )}

                    <PrimaryButton
                        name="Setup"
                        disabled={
                            value.length !== 10 ||
                            selectedValue === "Select service provider"
                        }
                        onPress={handleSetup}
                    />

                </View>

            </KeyboardAwareScrollView>

            <KeyboardToolbar />
        </View>
    )
}

export default SetupPaymentMethod;