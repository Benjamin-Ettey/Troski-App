import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Modal,
    Image
} from "react-native";
import React, {useEffect, useState} from "react";
import { router, useFocusEffect } from "expo-router";
import { useAppStore } from "@/utils/store";
import PrimaryButton from "@/components/PrimaryButton";
import DisabledPrimaryButton from "@/components/DisabledPrimaryButton";
import { Ionicons } from "@expo/vector-icons";

const SelectPaymentMethod = () => {
    const paymentMethods = useAppStore((s) => s.paymentMethods);
    const tripPrice = useAppStore((s) => s.finalTripPrice);

    const selectedPaymentMethod = useAppStore((s) => s.selectedPaymentMethod);
    const setSelectedPaymentMethod = useAppStore((s) => s.setSelectedPaymentMethod);

    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const [selectedType, setSelectedType] =
        useState<"wallet" | "momo" | null>(null);

    const [processing, setProcessing] = useState(false);

    useFocusEffect(
        React.useCallback(() => {
            if (selectedType === "momo" && selectedPaymentMethod) {
                setSelectedType("momo");
            } else if (selectedType === "wallet") {
                setSelectedType("wallet");
            } else if (selectedPaymentMethod) {
                setSelectedType("momo");
            } else {
                setSelectedType(null);
            }
        }, [selectedPaymentMethod])
    );

    const handleSelectWallet = () => {
        setSelectedType("wallet");
    };

    const handleSelectMomo = (item: any) => {
        setSelectedType("momo");
        setSelectedPaymentMethod(item);
    };

    const canContinue =
        selectedType === "wallet" ||
        (selectedType === "momo" && selectedPaymentMethod);

    const handleContinue = () => {
        setProcessing(true);

        setTimeout(() => {
            setProcessing(false);
            setShowSuccessModal(true)

        }, 3000);
    };

    useEffect(() => {

        if(showSuccessModal){

            const timer = setTimeout(() => {
                setShowSuccessModal(false);

                router.replace("/homepage/bookings/searchDriver");

            }, 2000);

            return () => clearTimeout(timer);
        }

    }, [showSuccessModal]);


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

    return (
        <View style={{ flex: 1, backgroundColor: "#F5F7FA" }}>
            <ScrollView
                className="flex-1 w-full"
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
            >
                <View
                    style={{ paddingHorizontal: 24, paddingTop: 16 }}
                    className="w-full flex justify-center"
                >
                    <TouchableOpacity
                        onPress={handleSelectWallet}
                        className="bg-general flex flex-row justify-between items-center"
                        style={{
                            padding: 16,
                        }}
                    >
                        <View
                            style={{ gap: 32 }}
                            className="flex flex-row justify-center items-center"
                        >
                            <Ionicons name="wallet" size={32} color="black" />

                            <View>
                                <Text className="font-GoogleSansBold">
                                    Pay with wallet
                                </Text>

                                <Text className="font-GoogleSansRegular">
                                    {`GH₵ ` + tripPrice}
                                </Text>
                            </View>
                        </View>

                        {selectedType === "wallet" ? (
                            <Ionicons
                                name="radio-button-on"
                                size={24}
                                color="black"
                            />
                        ) : (
                            <Ionicons
                                name="radio-button-off"
                                size={24}
                                color="black"
                            />
                        )}
                    </TouchableOpacity>
                </View>

                <View style={{ padding: 24 }} className="w-full flex justify-center">
                    {paymentMethods.map((item: any, index: number) => (
                        <View
                            key={index}
                            style={{
                                marginBottom: 24,
                                padding: 16,
                            }}
                            className="w-full bg-general flex flex-row justify-between items-center"
                        >
                            <View style={{ flex: 1 }}>
                                <TouchableOpacity
                                    onPress={() => handleSelectMomo(item)}
                                    className="flex-1 flex flex-row justify-start items-center"
                                    style={{ gap: 24 }}
                                >
                                    <View
                                        style={{
                                            width: 40,
                                            height: 40,
                                            overflow: "hidden",
                                        }}
                                        className="rounded-full flex justify-center items-center bg-general"
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

                                    <View className="flex flex-col justify-start items-start">
                                        <Text className="font-GoogleSansBold">
                                            {item.provider}
                                        </Text>

                                        <Text className="font-GoogleSansRegular">
                                            {item.number}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            </View>

                            {selectedType === "momo" &&
                            selectedPaymentMethod?.number === item.number ? (
                                <Ionicons
                                    name="radio-button-on"
                                    size={24}
                                    color="black"
                                />
                            ) : (
                                <Ionicons
                                    name="radio-button-off"
                                    size={24}
                                    color="black"
                                />
                            )}
                        </View>
                    ))}

                    <View className="w-full flex justify-center items-center">
                        <TouchableOpacity
                            onPress={() =>
                                router.navigate(
                                    "/profile/paymentMethod/setupPaymentMethod"
                                )
                            }
                            className="bg-secondaryBlack flex justify-center items-center rounded-full"
                            style={{ width: "50%", padding: 10 }}
                        >
                            <Text className="text-general font-GoogleSansRegular">
                                Add another method
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            <View
                style={{ bottom: 24 }}
                className="w-full flex justify-center items-center absolute"
            >
                {!canContinue ? (
                    <DisabledPrimaryButton name="Continue" />
                ) : (
                    <PrimaryButton
                        name="Continue"
                        disabled={processing}
                        onPress={handleContinue}
                    />
                )}
            </View>

            <Modal visible={processing} transparent animationType="fade">
                <View
                    style={{
                        flex: 1,
                        backgroundColor: "rgba(0,0,0,0.5)",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <ActivityIndicator size="large" color="white" />

                    <Text
                        style={{ marginTop: 12 }}
                        className="font-GoogleSansMedium text-general"
                    >
                        Processing...
                    </Text>
                </View>
            </Modal>

            <Modal style={{flex: 1}} className="w-full flex justify-center items-center" animationType="fade" visible={showSuccessModal} transparent>

                <View
                    style={{
                    flex: 1,
                    backgroundColor: "rgba(0,0,0,0.5)",
                    justifyContent: "center",
                    alignItems: "center",
                }}>
                    <View className="w-full absolute flex-1 bg-general flex flex-col justify-center items-center"
                          style={{bottom: 0, gap: 10, height: "40%", borderTopRightRadius: 32, borderTopLeftRadius: 32}}>
                        <View  className="w-full flex-1 flex justify-center items-center" style={{gap: 16}} >
                            <Image
                                source={require("../../../assets/images/check.png")}
                                style={{width: "30%", height: "30%"}}
                                resizeMode="contain"
                            />
                            <View>
                                <Text
                                    className="font-GoogleSansMedium flex-shrink text-center text-secondaryBlack ">
                                    Payment successfully
                                </Text>
                                <Text

                                    className="font-GoogleSansRegular flex-shrink text-center text-secondaryBlack ">
                                    You will be redirect shortly.
                                </Text>
                            </View>


                        </View>

                    </View>
                </View>

            </Modal>
        </View>
    );
};

export default SelectPaymentMethod;