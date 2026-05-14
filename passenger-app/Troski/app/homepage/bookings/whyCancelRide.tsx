import { View, Text, Modal, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import PrimaryButton from "@/components/PrimaryButton";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import DisabledPrimaryButton from "@/components/DisabledPrimaryButton";

const WhyCancelRide = () => {

    const [selectedReason, setSelectedReason] = useState<string | null>(null);

    const cancelReasons = [
        "Driver is taking too long",
        "Changed my mind",
        "Booked by mistake",
        "Found another ride",
        "Pickup location is incorrect",
        "Driver asked me to cancel",
        "Price is too high",
        "Emergency or personal reason",
        "Vehicle details don't match",
        "Other"
    ];

    return (
        <View style={{ flex: 1 }} className="bg-general">
            <SafeAreaView>
                <Modal style={{ flex: 1 }} className="flex items-center" visible>

                    <View style={{ marginTop: "15%", padding: 16 }} className="w-full">
                        <Text className="text-xl tracking-tight font-GoogleSansMedium">
                            Why did you cancel ride?
                        </Text>

                        <Text className="mt-2 text-gray-500 font-GoogleSansRegular">
                            Select a reason to help us improve your experience.
                        </Text>
                    </View>

                    <View style={{ paddingHorizontal: 16, marginTop: 10 }}>
                        {cancelReasons.map((reason, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => setSelectedReason(reason)}
                                className={`p-4 rounded-2xl mb-3 border ${
                                    selectedReason === reason
                                        ? "border-green-500 bg-green-50"
                                        : "border-gray-200 bg-white"
                                }`}
                            >
                                <Text
                                    className={`font-GoogleSansMedium ${
                                        selectedReason === reason
                                            ? "text-green-600"
                                            : "text-black"
                                    }`}
                                >
                                    {reason}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View
                        style={{ bottom: 30 }}
                        className="absolute flex justify-center items-center w-full"
                    >
                        {selectedReason?
                            <PrimaryButton
                                name="Submit"
                                disabled={false}
                                onPress={() => router.replace("/homepage")}
                            />
                            :
                            <DisabledPrimaryButton name="Sumbit"/>
                        }

                    </View>

                </Modal>
            </SafeAreaView>
        </View>
    )
}

export default WhyCancelRide