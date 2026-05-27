import {View, Text} from 'react-native'
import React, {useState} from 'react'
import {KeyboardAwareScrollView, KeyboardToolbar} from "react-native-keyboard-controller";
import {StatusBar} from "expo-status-bar";
import {router} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import PrimaryButton from "@/components/PrimaryButton";
import { OtpInput } from "react-native-otp-entry";
import {useAppStore} from "@/utils/store";
import DisabledPrimaryButton from "@/components/DisabledPrimaryButton";

const NewPinScreen = () => {

    const setDriverPin = useAppStore((state) => state.setDriverPin);

    const [disable, setDisable] = useState(true);
    const [value, setValue] = useState("");

    const handleNext = () => {
        if (value.length !== 6) return;

        router.push({
            pathname: "/login/forgotPin/confirmNewPinScreen",
        });
    };

    const handleOTP = (pin: string) => {
        setValue(pin);
        setDriverPin(pin);

        setDisable(pin.length !== 6);
    };

    return (
        <View className="flex-1 bg-general">
            <KeyboardAwareScrollView
                keyboardShouldPersistTaps="handled"
                className="flex-1">
                <StatusBar style="dark"/>


                <View className="w-full flex-1 flex items-center px-6">
                    <View className="w-full mb-4">
                        <Text className="text-2xl leading-7  font-GoogleSansMedium tracking-tight">Create 6 digit pin</Text>
                        <Text className="text-sm leading-4  font-GoogleSansRegular">Enter 6 digit pin code</Text>

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
                            <Text className="text-sm leading-4 mb-1 font-GoogleSansRegular ">Use a pin you can easily remember.</Text>
                        </View>
                    </View>

                    {disable?
                        (<DisabledPrimaryButton name="Next" />)
                        :
                        (<PrimaryButton name="Next" disabled={disable} onPress={handleNext}/>)

                    }
                </View>

            </KeyboardAwareScrollView>
            <KeyboardToolbar/>
        </View>

    )
}
export default NewPinScreen
