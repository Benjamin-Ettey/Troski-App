import {
    View,
    Text,
    TouchableOpacity,
    Alert,
    ScrollView,
    Image
} from 'react-native'
import React from 'react'
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAppStore } from "@/utils/store";
import PrimaryButton from "@/components/PrimaryButton";
import {useColorScheme} from "nativewind";

const Index = () => {

    const paymentMethods = useAppStore((state) => state.paymentMethods);
    const { colorScheme } = useColorScheme();

    const removePaymentMethod =
        useAppStore((state) => state.removePaymentMethod);

    const hasPaymentMethod = paymentMethods.length > 0;

    const clearPaymentMethod =
        useAppStore((state) => state.clearPaymentMethod);

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

    const handleDeletePaymentMethod = (index: any) => {

        Alert.alert(
            "Delete Payment Method?",
            "You are about to permanently delete your payment method.",
            [
                { text: "Cancel", style: "cancel" },

                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => removePaymentMethod(index)
                }
            ]
        );
    };

    return (

        <View
            style={{ backgroundColor: colorScheme === "dark"? "#000000" : "#F5F7FA", flex: 1 }}
            className="w-full"
        >

            {!hasPaymentMethod ?

                <View
                    style={{ flex: 1, marginTop: "-20%" }}
                    className="w-full flex justify-center items-center"
                >

                    <Ionicons
                        style={{ marginBottom: 10 }}
                        name="cash-outline"
                        size={100}
                        color="gray"
                    />

                    <Text className="font-GoogleSansMedium dark:text-general">
                        No Payment Method
                    </Text>

                    <Text
                        style={{ marginBottom: 16 }}
                        className="font-GoogleSansRegular text-center flex-shrink dark:text-tertiaryGray"
                    >
                        Add a payment method to see it here.
                    </Text>

                    <TouchableOpacity
                        onPress={() =>
                            router.push("/profile/paymentMethod/setupPaymentMethod")
                        }
                        style={{
                            paddingHorizontal: 12,
                            paddingVertical: 12,
                            height: 42,
                        }}
                        className="bg-primary rounded-full flex justify-center items-center"
                    >
                        <Text className="font-GoogleSansMedium">
                            Setup Payment Method
                        </Text>
                    </TouchableOpacity>

                </View>

                :

                <>
                    <ScrollView>

                        <View
                            style={{
                                paddingLeft: 16,
                                paddingRight: 16,
                                flex: 1
                            }}
                            className="w-full"
                        >

                            {paymentMethods.map((item: any, index: any) => (

                                <View key={index}>
                                    <View
                                        key={index}
                                        style={{
                                            height: 72,
                                            borderRadius: 24,
                                            paddingLeft: 20,
                                            paddingRight: 20,
                                        }}
                                        className="w-full flex flex-row justify-between items-center"
                                    >

                                        {/* PROVIDER LOGO */}
                                        <View
                                            style={{
                                                width: 44,
                                                height: 44,
                                                overflow: "hidden",
                                            }}
                                            className="rounded-full"
                                        >
                                            <Image
                                                source={getProviderLogo(item.provider)}
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                }}
                                                resizeMode="cover"
                                            />
                                        </View>

                                        {/* PROVIDER DETAILS */}
                                        <View className="flex-1" style={{paddingHorizontal: 16}}>

                                            <Text className="font-GoogleSansBold dark:text-general">
                                                {item.provider}
                                            </Text>

                                            <Text className="font-GoogleSansRegular dark:text-tertiaryGray">
                                                {item.number}
                                            </Text>

                                        </View>

                                        {/* DELETE BUTTON */}
                                        <TouchableOpacity
                                            onPress={() =>
                                                handleDeletePaymentMethod(index)
                                            }
                                            style={{
                                                padding: 8,
                                            }}
                                            className="rounded-full"
                                        >
                                            <Ionicons
                                                name="remove-circle-outline"
                                                size={24}
                                                color="red"
                                            />
                                        </TouchableOpacity>
                                </View>



                                    <View className="w-full flex justify-end items-end">
                                        <View
                                            style={{height: 1, width: "80%", backgroundColor: colorScheme === "dark"? "#a9a9a933":"#e4e4e4"}} />
                                    </View>
                                </View>

                            ))}

                        </View>

                    </ScrollView>

                    <View
                        className="absolute flex justify-center items-center w-full"
                        style={{ bottom: 0, height: 100 }}
                    >
                        <PrimaryButton
                            name="Add payment method"
                            onPress={() =>
                                router.push(
                                    "/profile/paymentMethod/setupPaymentMethod"
                                )
                            }
                            disabled={false}
                        />
                    </View>
                </>
            }

        </View>
    )
}

export default Index