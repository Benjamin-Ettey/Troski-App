import {View, Text, TextInput, ActivityIndicator, Modal} from 'react-native'
import React, {useEffect, useState} from 'react'
import {KeyboardAwareScrollView, KeyboardToolbar} from "react-native-keyboard-controller";
import {StatusBar} from "expo-status-bar";
import {router} from "expo-router";
import PrimaryButton from "@/components/PrimaryButton";
import DisabledPrimaryButton from "@/components/DisabledPrimaryButton";

const Withdraw = () => {

    const [value, setValue] = useState('');
    const [amount, setAmount] = useState('');
    const [error, setError] = useState('');
    const isDisabled = value.length !== 10 || amount.length === 0;
    const [processing, setProcessing] = useState(false);



    const validate = (text: string) => {
        const cleaned = text.replace(/[^0-9]/g, '');
        setValue(cleaned);

        if (cleaned.length === 0) {
            setError('');
        } else if (cleaned.length !== 10) {
            setError('Number must be exactly 10 digits');
        } else {
            setError('');
        }
    };

    const handleAmount = (text: string) => {
        const amount = text.replace(/[^0-9]/g, '');
        setAmount(amount);
    };

    const handleNext = () => {
        if (value.length !== 10) {
            setError('Enter a valid 10-digit number');
            return;
        }



        // Show modal and start timer
        setProcessing(true);

        const timer = setTimeout(()=>{
            setProcessing(false);
            router.back();
        }, 3000);

        return () => clearTimeout(timer);
    };

    return (
        <View style={{backgroundColor: "#F5F7FA"}} className="flex-1 ">
            <KeyboardAwareScrollView
                keyboardShouldPersistTaps="handled"
                className="flex-1">
                <StatusBar style="dark"/>

                <View className="w-full flex-1 flex items-center px-6">
                    <View className="w-full py-2">
                        <Text className="text-xl leading-tight tracking-tight font-GoogleSansMedium ">Enter account number?</Text>
                    </View>

                    <TextInput
                        maxLength={10}
                        value={value}
                        onChangeText={validate}
                        autoCorrect={false}
                        autoCapitalize="none"
                        keyboardType="phone-pad"
                        placeholderTextColor="#a9a9a9"
                        autoFocus={true}
                        style={{paddingLeft: 16 }}
                        className=" mb-1 font-medium  text-secondaryGray w-full h-14 border border-tertiaryGray  rounded-xl focus:border  focus:border-green-600/40"
                    />

                    {error ? (
                        <View className="mb-6 w-full items-start">
                            <Text className="text-sm leading-tight font-GoogleSansMedium text-red-600">
                                {error}
                            </Text>
                        </View>
                    ) : <View className="mb-6 w-full items-start">
                        <Text className="text-sm leading-tight font-GoogleSansRegular">This is the number you would like to withdraw your money into.</Text>
                    </View>
                    }

                    <View className="w-full py-2">
                        <Text className="text-xl leading-tight tracking-tight font-GoogleSansMedium ">Amount to be withdrawn?</Text>
                    </View>

                    <TextInput
                        maxLength={10}
                        value={amount}
                        placeholder="GH₵10.50"
                        onChangeText={handleAmount}
                        autoCorrect={false}
                        autoCapitalize="none"
                        keyboardType="phone-pad"
                        placeholderTextColor="#a9a9a9"
                        style={{paddingLeft: 16}}
                        className="mb-8 font-medium  text-secondaryGray w-full h-14 border border-tertiaryGray  rounded-xl focus:border  focus:border-green-600/40"
                    />

                    {isDisabled?
                        (<DisabledPrimaryButton name="Withdraw" />)
                        :
                        (<PrimaryButton name="Withdraw" disabled={isDisabled} onPress={handleNext}/>)
                    }
                </View>
            </KeyboardAwareScrollView>
            <KeyboardToolbar/>

            <Modal visible={processing} transparent animationType="fade">
                <View
                    className="flex-1 flex justify-center items-center"
                    style={{
                        backgroundColor: "rgba(0,0,0,0.5)",
                    }}
                >
                    <ActivityIndicator size="large" color="white" />

                    <Text
                        className="font-GoogleSansMedium mt-4 text-general text-base leading-tight"
                    >
                        Processing...
                    </Text>
                </View>
            </Modal>
        </View>
    )
}
export default Withdraw
