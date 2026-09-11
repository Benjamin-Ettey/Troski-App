import {View, Text} from 'react-native'
import React, {useState} from 'react'
import {KeyboardAwareScrollView, KeyboardToolbar} from "react-native-keyboard-controller";
import {StatusBar} from "expo-status-bar";
import {router, useFocusEffect} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import PrimaryButton from "@/components/PrimaryButton";
import { OtpInput } from "react-native-otp-entry";
import {useAppStore} from "@/utils/store";
import DisabledPrimaryButton from "@/components/DisabledPrimaryButton";

const ConfirmNewPinCode = () => {

    const drivertemppin = useAppStore((state) => state.drivertemppin);
    const setDriverPin = useAppStore((state) => state.setDriverPin);
    const setDriverTempPin = useAppStore((state)=> state.setDriverTempPin);


    const [value, setValue] = useState("");

    const disable =
        value.length !== 6 || value !== drivertemppin;


    useFocusEffect(() => {
        return () => {
            setDriverTempPin("");
        };
    });

    const handleNext = () => {
        if (disable) return;


        setDriverPin(value);
        useAppStore.getState().setDriverTempPin("");


        router.replace("/homepage");
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
                        <Text className="text-2xl leading-7 font-GoogleSansMedium tracking-tight text-secondaryBlack">Confirm new 6-digit PIN</Text>
                        <Text className="text-sm leading-4 font-GoogleSansRegular text-secondaryBlack">Verify your new pin code.</Text>

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
                            <Ionicons name="lock-closed" size={10} color="gray"  className="mt-1"/>
                            <Text  className="text-sm mb-1 flex-shrink font-GoogleSansRegular text-secondaryBlack">Keep your PIN confidential. Do not share it with anyone.</Text>
                        </View>

                        <View className="flex flex-row justify-start w-full gap-2">
                            <Ionicons name="shield-checkmark" size={10} color="gray"  className="mt-1"/>
                            <Text  className="text-sm mb-1 flex-shrink font-GoogleSansRegular text-secondaryBlack">You will use this PIN to access your wallet and confirm transactions.</Text>
                        </View>


                    </View>

                    {disable?
                        (<DisabledPrimaryButton name="Confirm new pin" />)
                        :
                        (<PrimaryButton name="Confirm new pin" disabled={disable} onPress={handleNext}/>)

                    }
                </View>

            </KeyboardAwareScrollView>
            <KeyboardToolbar/>
        </View>

    )
}
export default ConfirmNewPinCode
