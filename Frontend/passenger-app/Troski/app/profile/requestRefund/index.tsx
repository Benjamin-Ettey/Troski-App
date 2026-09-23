import {
    View,
    Text,
    ScrollView,
    TextInput,
    Modal,
    ActivityIndicator,
    Alert,
} from "react-native";
import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import PrimaryButton from "@/components/PrimaryButton";
import DisabledPrimaryButton from "@/components/DisabledPrimaryButton";
import { StatusBar } from "expo-status-bar";
import {useColorScheme} from "nativewind";

const RequestRefund = () => {
    const [description, setDescription] = useState("");
    const [processing, setProcessing] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const { colorScheme } = useColorScheme();


    const isDisabled = description.trim().length === 0;

    const handleSubmit = () => {


        if (description.trim().length === 0) {
            Alert.alert("Please provide details", "Tell us more about your refund request");
            return;
        }

        setProcessing(true);

        setTimeout(() => {
            setProcessing(false);
            setSubmitted(true);

            setTimeout(() => {
                router.back();
            }, 3000);
        }, 1000);
    };

    if (submitted) {
        return (
            <Modal visible>
                <View className="flex-1 w-full bg-general dark:bg-secondaryBlack px-6 items-center justify-center">
                    <StatusBar style="dark" />

                    <View className="items-center gap-4 justify-center">
                        <View
                            style={{
                                backgroundColor: "#22C55E20",
                            }}
                            className="items-center justify-center w-20 h-20 rounded-full"
                        >
                            <Ionicons name="checkmark-circle" size={48} color="#22C55E" />
                        </View>

                        <Text className="font-GoogleSansMedium text-xl leading-6 text-center dark:text-general">
                            Refund request submitted
                        </Text>

                        <Text className="font-GoogleSansRegular text-center text-gray-600 text-sm leading-4 dark:text-tertiaryGray">
                            Our support team will review your request and respond within 24-48 hours
                        </Text>
                    </View>
                </View>
            </Modal>
        );
    }

    return (
        <View style={{backgroundColor: colorScheme === "dark"? "#000000" : "#F5F7FA"}} className="flex-1 ">
            <StatusBar style="dark" />

            <ScrollView
                keyboardShouldPersistTaps="handled"
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 100 }}
            >


                <View className="px-6 gap-6 py-2">


                    <View>
                        <Text className="font-GoogleSansMedium mb-2 dark:text-general">
                            Provide more details
                        </Text>

                        <TextInput
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Tell us what happened..."
                            placeholderTextColor="#999"
                            multiline
                            numberOfLines={5}
                            maxLength={500}
                            style={{

                                textAlignVertical: "top",
                            }}
                            className="bg-general px-5 py-4 dark:bg-secondaryBlack dark:text-general border border-gray-200 rounded-xl font-GoogleSansRegular text-sm"
                        />

                        <View className="flex flex-row justify-between items-center mt-2">
                            <Text className="text-xs leading-4 text-secondaryGray font-GoogleSansRegular">
                                {description.length}/500 characters
                            </Text>
                        </View>

                    </View>


                    <View style={{height: 1, }} className="w-full bg-tertiaryWhite dark:bg-secondaryGray/20"/>

                    <View
                        className=" flex flex-row gap-3"
                    >
                        <Ionicons name="information-circle" size={24} color="#EF4444FF" />

                        <View className="flex-1 flex justify-start items-start flex-col">
                            <Text
                                className="font-GoogleSansMedium mb-1 text-base leading-5 flex-1 flex-shrink dark:text-tertiaryWhite"
                            >
                                Refund Notice
                            </Text>
                            <Text
                                className="font-GoogleSansRegular text-xs leading-4 text-secondaryGray flex-1 dark:text-tertiaryGray"
                            >
                                Refund requests are reviewed within 24-48 hours. Once approved, the
                                amount will be credited to your wallet.
                            </Text>
                        </View>

                    </View>

                    <View
                        className="flex justify-center items-center px-6 py-4 "
                    >
                        {isDisabled ? (
                            <DisabledPrimaryButton name="Submit refund request" />
                        ) : (
                            <PrimaryButton
                                name="Submit refund request"
                                disabled={isDisabled}
                                onPress={handleSubmit}
                            />
                        )}
                    </View>
                </View>
            </ScrollView>




            <Modal visible={processing} transparent animationType="fade">
                <View
                    style={{
                        flex: 1,
                        backgroundColor: "rgba(0,0,0,0.5)",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <View
                        className=" p-6 flex items-center gap-4"
                        style={{ width: "80%", maxWidth: 280 }}
                    >
                        <ActivityIndicator size="large" color="#FFFFFF" />

                        <Text className="font-GoogleSansMedium text-general text-center">
                            Submitting request...
                        </Text>

                        <Text className="font-GoogleSansRegular text-general text-xs text-center ">
                            Please wait while we process your refund request
                        </Text>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default RequestRefund;