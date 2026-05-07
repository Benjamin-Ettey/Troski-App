import {View, Text} from 'react-native'
import React, {useState} from 'react'
import {KeyboardAwareScrollView, KeyboardToolbar} from "react-native-keyboard-controller";
import {StatusBar} from "expo-status-bar";
import {router} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import PrimaryButton from "@/components/PrimaryButton";
import { OtpInput } from "react-native-otp-entry";

const NewPinCode = () => {

    const [disable, setDisable] = useState(true);
    const [value, setValue] = useState("");

    const handleNext = ()=>{

        if (value.length !== 6) return
        router.replace({
            pathname: "/profile/settings",
            params: {pin: value}

        })
    }

    const handleOTP = (text: any) => {
        setValue(text);

        if (text.length === 6) {
            setDisable(false);
        } else {
            setDisable(true);
        }
    };

    return (
        <View style={{backgroundColor: "#F5F7FA"}} className="flex-1">
            <KeyboardAwareScrollView
                keyboardShouldPersistTaps="handled"
                className="flex-1">
                <StatusBar style="dark"/>


                <View className="w-full flex-1 flex items-center px-6">
                    <View className="w-full mb-4">
                        <Text className="text-2xl font-GoogleSansMedium tracking-tight">Create a new 6-digit PIN</Text>
                        <Text className="text-sm font-GoogleSansRegular">Choose a new PIN to secure your account and authorize transactions.</Text>

                    </View>

                    <OtpInput
                        placeholder="******"
                        numberOfDigits={6}
                        autoFocus={true}
                        onTextChange={handleOTP}
                        type="numeric"


                    />
                    <View className="mt-6 mb-8 w-full flex flex-col justify-center items-start">
                        <View className="flex flex-row justify-start w-full ">
                            <Ionicons name="lock-closed" size={10} color="gray" style={{marginRight: "2%"}} className="mt-1"/>
                            <Text style={{flexShrink: 1}}  className="text-sm mb-1 font-GoogleSansRegular">Keep your PIN confidential. Do not share it with anyone.</Text>
                        </View>

                        <View className="flex flex-row justify-start w-full ">
                            <Ionicons name="shield-checkmark" size={10} color="gray" style={{marginRight: "2%"}} className="mt-1"/>
                            <Text style={{flexShrink: 1}}  className="text-sm mb-1 font-GoogleSansRegular">You will use this PIN to access your wallet and confirm transactions.</Text>
                        </View>


                    </View>

                    <PrimaryButton disabled={disable} name="Next" onPress={handleNext}/>
                </View>

            </KeyboardAwareScrollView>
            <KeyboardToolbar/>
        </View>

    )
}
export default NewPinCode
