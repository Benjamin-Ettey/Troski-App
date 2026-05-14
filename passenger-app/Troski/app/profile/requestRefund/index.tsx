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

const RequestRefund = () => {
    const [description, setDescription] = useState("");
    const [processing, setProcessing] = useState(false);
    const [submitted, setSubmitted] = useState(false);



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
            }, 1500);
        }, 1000);
    };

    if (submitted) {
        return (
            <Modal visible>
                <View className="flex-1 w-full bg-general px-6 items-center justify-center">
                    <StatusBar style="dark" />

                    <View className="items-center gap-4 justify-center">
                        <View
                            style={{
                                width: 80,
                                height: 80,
                                borderRadius: 40,
                                backgroundColor: "#22C55E20",
                            }}
                            className="items-center justify-center"
                        >
                            <Ionicons name="checkmark-circle" size={48} color="#22C55E" />
                        </View>

                        <Text className="font-GoogleSansMedium text-xl text-center">
                            Refund request submitted
                        </Text>

                        <Text className="font-GoogleSansRegular text-center text-gray-600 text-sm">
                            Our support team will review your request and respond within 24-48 hours
                        </Text>
                    </View>
                </View>
            </Modal>
        );
    }

    return (
        <View className="flex-1 bg-general">
            <StatusBar style="dark" />

            <ScrollView
                keyboardShouldPersistTaps="handled"
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 100 }}
            >


                <View className="px-6 gap-6">


                    <View>
                        <Text className="font-GoogleSansMedium text-base mb-3">
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
                                paddingHorizontal: 14,
                                paddingVertical: 12,
                                textAlignVertical: "top",
                            }}
                            className="bg-white border border-gray-200 rounded-xl font-GoogleSansRegular text-sm"
                        />

                        <View className="flex flex-row justify-between items-center mt-2">
                            <Text className="text-xs text-gray-500 font-GoogleSansRegular">
                                {description.length}/500 characters
                            </Text>
                        </View>
                    </View>


                    <View
                        className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-row gap-3"
                    >
                        <Ionicons name="information-circle" size={20} color="#0165FC" />
                        <Text
                            className="font-GoogleSansRegular text-xs text-gray-700 flex-1"
                            style={{ lineHeight: 18 }}
                        >
                            Refund requests are reviewed within 24-48 hours. Once approved, the
                            amount will be credited to your wallet.
                        </Text>
                    </View>

                    <View
                        className="flex justify-center items-center px-6 py-4 bg-general"
                        style={{ elevation: 10 }}
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