import { View, Text, Modal, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import PrimaryButton from "@/components/PrimaryButton";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import DisabledPrimaryButton from "@/components/DisabledPrimaryButton";
import {useColorScheme} from "nativewind";

const WhyCancelRide = () => {

    const [selectedReason, setSelectedReason] = useState<string | null>(null);
    const { colorScheme } = useColorScheme();


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
        <View style={{ flex: 1,  }} >
            <SafeAreaView>
                <Modal visible>

                    <View style={{backgroundColor: colorScheme === "dark"? "#000000" : "#F5F7FA"}} className="flex-1 flex ">
                        <View style={{ marginTop: "15%", padding: 16 }} className="w-full">
                            <Text className="text-xl tracking-tight font-GoogleSansMedium dark:text-general">
                                Why did you cancel ride?
                            </Text>

                            <Text className="mt-2 text-gray-500 font-GoogleSansRegular dark:text-tertiaryGray">
                                Select a reason to help us improve your experience.
                            </Text>
                        </View>

                        <View style={{ paddingHorizontal: 16, marginTop: 10 }}>
                            {cancelReasons.map((reason, index) => (
                                <TouchableOpacity
                                    key={index}
                                    onPress={() => setSelectedReason(reason)}
                                    className={`p-4 rounded-2xl mb-3 border  ${
                                        selectedReason === reason
                                            ? "border-green-500 bg-green-50 dark:bg-secondaryBlack"
                                            : "border-gray-200 bg-white dark:bg-secondaryBlack"
                                    }`}
                                >
                                    <Text
                                        className={`font-GoogleSansMedium  ${
                                            selectedReason === reason
                                                ? "text-green-600"
                                                : "text-black dark:text-general"
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
                    </View>


                </Modal>
            </SafeAreaView>
        </View>
    )
}

export default WhyCancelRide