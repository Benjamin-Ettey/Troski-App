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

const NewPinCode = () => {

    const setDriverTempPin = useAppStore((state) => state.setDriverTempPin);


    const [value, setValue] = useState("");

    const disable = value.length !== 6;

    const handleNext = () => {
        if (disable) return;

        setDriverTempPin(value);

        router.push("/homepage/profile/settings/changePinCode/confirmNewPinCode");
    };

    const handleOTP = (text: string) => {
        setValue(text);

    };

    return (
        <View style={{backgroundColor: "#F5F7FA"}} className="flex-1">
            <KeyboardAwareScrollView
                keyboardShouldPersistTaps="handled"
                className="flex-1">
                <StatusBar style="dark"/>


                <View className="w-full flex-1 flex items-center px-6">
                    <View className="w-full mb-4">
                        <Text className="text-2xl leading-7 font-GoogleSansMedium tracking-tight text-secondaryBlack">Create a new 6-digit PIN</Text>
                        <Text className="text-sm leading-4 font-GoogleSansRegular text-secondaryBlack">Choose a new PIN to secure your account and authorize transactions.</Text>

                    </View>

                    <OtpInput
                        placeholder="******"
                        numberOfDigits={6}
                        autoFocus={true}
                        onTextChange={handleOTP}
                        type="numeric"


                    />
                    <View className="mt-6 mb-8 w-full flex flex-col justify-center items-start">
                        <View className="flex flex-row justify-start w-full gap-2">
                            <Ionicons name="lock-closed" size={10} color="gray"  className="mt-1 "/>
                            <Text  className="text-sm leading-4 mb-1 flex-shrink font-GoogleSansRegular text-secondaryBlack">Keep your PIN confidential. Do not share it with anyone.</Text>
                        </View>

                        <View className="flex flex-row justify-start w-full gap-2">
                            <Ionicons name="shield-checkmark" size={10} color="gray" className="mt-1"/>
                            <Text  className="text-sm leading-4 mb-1 flex-shrink font-GoogleSansRegular text-secondaryBlack">You will use this PIN to access your wallet and confirm transactions.</Text>
                        </View>


                    </View>

                    {disable?
                        (<DisabledPrimaryButton name="Create new pin" />)
                        :
                        (<PrimaryButton name="Create new pin" disabled={disable} onPress={handleNext}/>)

                    }
                </View>

            </KeyboardAwareScrollView>
            <KeyboardToolbar/>
        </View>

    )
}
export default NewPinCode
