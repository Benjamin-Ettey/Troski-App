import {View, Text, ActivityIndicator, Modal} from 'react-native'
import React, { useState} from 'react'
import {KeyboardAwareScrollView, KeyboardToolbar} from "react-native-keyboard-controller";
import {StatusBar} from "expo-status-bar";
import { useRouter} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import PrimaryButton from "@/components/PrimaryButton";
import { OtpInput } from "react-native-otp-entry";
import {useAppStore} from "@/utils/store";
import DisabledPrimaryButton from "@/components/DisabledPrimaryButton";

const ConfirmNewPinScreen = () => {

    const [ processing, setProcessing ] = useState(false);
    const router = useRouter();
    const driverpin = useAppStore((state) => state.driverpin);

    const [value, setValue] = useState("");

    const disable = value.length !== 6 || value !== driverpin;

    const handleNext = () => {
        if (disable) return;

        setProcessing(true);

        const timer = setTimeout(()=>{
            setProcessing(false);
            router.replace("/login/pinScreen");

            return()=>clearTimeout(timer);
        }, 3000)
    };

    const handleOTP = (text: string) => {
        setValue(text);
    };

    return (
        <View className="flex-1  bg-general">
            <KeyboardAwareScrollView
                keyboardShouldPersistTaps="handled"
                className="flex-1">
                <StatusBar style="dark"/>


                <View className="w-full flex-1 flex items-center px-6">
                    <View className="w-full mb-4">
                        <Text className="text-2xl leading-7  font-GoogleSansMedium tracking-tight">Verify 6 digit pin</Text>
                        <Text className="text-sm leading-4  font-GoogleSansRegular">Re-enter 6 digit pin code</Text>

                    </View>

                    <OtpInput
                        placeholder="******"
                        numberOfDigits={6}
                        autoFocus={true}
                        onTextChange={handleOTP}
                        type="numeric"
                        textInputProps={{
                            placeholderTextColor: "#000000",
                        }}
                        textProps={{
                            style: {
                                color: "#000000"
                            }
                        }}

                    />
                    <View className="mt-6 mb-8 w-full flex flex-col justify-center items-start">
                        <View className="flex flex-row justify-start w-full ">
                            <Ionicons name="lock-closed" size={10} color="gray" style={{marginRight: "2%"}} className="mt-1"/>
                            <Text style={{flexShrink: 1}}  className="text-sm leading-4 mb-1  font-GoogleSansRegular">Do not share this PIN code with anyone as this will be used to access your wallet transactions. </Text>
                        </View>

                        <View className="flex flex-row justify-start w-full">
                            <Ionicons name="pin" size={10} color="gray" style={{marginRight: "2%"}} className="mt-1"/>
                            <Text className="text-sm leading-4 mb-1  font-GoogleSansRegular">Use a pin you can easily remember.</Text>
                        </View>
                    </View>


                    {disable?
                        (<DisabledPrimaryButton name="Next" />)
                        :
                        (<PrimaryButton name="Next" disabled={disable} onPress={handleNext}/>)

                    }
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
                        <ActivityIndicator size="small" color="white" />

                        <Text
                            style={{ marginTop: 12 }}
                            className="font-GoogleSansMedium text-base leading-5 text-general"
                        >
                            Processing...
                        </Text>
                    </View>
                </Modal>

            </KeyboardAwareScrollView>
            <KeyboardToolbar/>
        </View>

    )
}
export default ConfirmNewPinScreen
