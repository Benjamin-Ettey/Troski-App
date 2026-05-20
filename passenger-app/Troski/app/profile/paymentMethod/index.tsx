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
            style={{ backgroundColor: colorScheme === "dark"? "#000000" : "#F5F7FA"}}
            className="w-full flex-1"
        >

            {!hasPaymentMethod ?

                <View
                    style={{ marginTop: "-20%" }}
                    className="w-full flex justify-center flex-1 items-center"
                >

                    <Ionicons
                        className="mb-3"
                        name="cash-outline"
                        size={100}
                        color="gray"
                    />

                    <Text className="font-GoogleSansMedium text-xl leading-6 tracking-tighter dark:text-general">
                        No Payment Method
                    </Text>

                    <Text
                        className="font-GoogleSansRegular mb-4 text-sm leading-4 text-center flex-shrink dark:text-tertiaryGray"
                    >
                        Add a payment method to see it here.
                    </Text>

                    <TouchableOpacity
                        onPress={() =>
                            router.push("/profile/paymentMethod/setupPaymentMethod")
                        }

                        className="bg-primary px-4 h-12 rounded-full flex justify-center items-center"
                    >
                        <Text className="font-GoogleSansMedium text-base leading-5">
                            Setup Payment Method
                        </Text>
                    </TouchableOpacity>

                </View>

                :

                <>
                    <ScrollView>

                        <View
                            className="w-full flex-1 px-5"
                        >

                            {paymentMethods.map((item: any, index: any) => (

                                <View key={index}>
                                    <View
                                        key={index}
                                        className="w-full px-6 py-5 flex flex-row justify-between items-center"
                                    >


                                        <View
                                            className="rounded-full w-12 h-12 overflow-hidden"
                                        >
                                            <Image
                                                source={getProviderLogo(item.provider)}
                                                className="w-full h-full"
                                                resizeMode="cover"
                                            />
                                        </View>


                                        <View className="flex-1 px-5" >

                                            <Text className="font-GoogleSansBold text-lg leading-5 dark:text-general">
                                                {item.provider}
                                            </Text>

                                            <Text className="font-GoogleSansRegular text-base leading-5 dark:text-tertiaryGray">
                                                {item.number}
                                            </Text>

                                        </View>


                                        <TouchableOpacity
                                            onPress={() =>
                                                handleDeletePaymentMethod(index)
                                            }
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
                        className="absolute flex justify-center bottom-10 items-center w-full"
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