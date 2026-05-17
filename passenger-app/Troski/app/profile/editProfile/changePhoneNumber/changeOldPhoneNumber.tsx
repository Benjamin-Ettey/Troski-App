import {View, Text, TextInput} from 'react-native'
import React, {useState} from 'react'
import {KeyboardAwareScrollView, KeyboardToolbar} from "react-native-keyboard-controller";
import {StatusBar} from "expo-status-bar";
import PrimaryButton from "@/components/PrimaryButton";
import {useAppStore} from "@/utils/store";
import {router} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import DisabledPrimaryButton from "@/components/DisabledPrimaryButton";
import {useColorScheme} from "nativewind";

const ChangeOldPhoneNumber = () => {

    const [value, setValue] = useState('');
    const [newValue, setNewValue] = useState('')
    const [error, setError] = useState('');
    const [newError, setNewError] = useState('')
    const { colorScheme } = useColorScheme();



    const number = useAppStore((state)=>state.number)
    const setNumber = useAppStore((state) => state.setNumber);

    const validate = (text: string) => {
        const cleaned = text.replace(/[^0-9]/g, '');
        setValue(cleaned);

        if (cleaned.length === 0) {
            setError('');
        } else if (cleaned.length === 10 && cleaned !== number) {
            setError('Number does not match your old number');
        } else {
            setError('');
        }
    };

    const validateNewNumber = (text: string) => {
        const cleaned = text.replace(/[^0-9]/g, '');
        setNewValue(cleaned);

        if (cleaned.length === 0) {
            setNewError('');
        } else if (cleaned.length !== 10) {
            setNewError('Number must be exactly 10 digits');
        } else if (cleaned === value) {
            setNewError('New number must be different from old number');
        } else {
            setNewError('');
        }
    };

    const handleChangePhoneNumber = () => {
        if (value.length !== 10) {
            setError('Enter a valid 10-digit number');
            return;
        }

        if (value !== number) {
            setError('Number does not match your old number');
            return;
        }

        if (newValue.length !== 10) {
            setNewError('Enter a valid 10-digit number');
            return;
        }

        if (newValue === value) {
            setNewError('New number must be different from old number');
            return;
        }

        setNumber(newValue);
        router.replace("/profile/editProfile/changePhoneNumber/otpChangePhoneNumber");
    };


    const isDisabled = value.length !== 10 || newValue.length !== 10 || value !== number || newValue === value;




    return (
        <View style={{backgroundColor: colorScheme === "dark"? "#000000" : "#F5F7FA", flex: 1}}>

            <KeyboardAwareScrollView
                keyboardShouldPersistTaps="handled"
                className="flex-1 ">
                <StatusBar style="dark"/>




                <View className="w-full flex-1 flex items-center px-6">
                    <View className="w-full py-2">
                        <Text className="text-xl tracking-tight font-GoogleSansMedium dark:text-general">Enter old phone number?</Text>
                    </View>

                    <TextInput
                        maxLength={10}
                        value={value}
                        onChangeText={validate}
                        autoCorrect={false}
                        autoCapitalize="none"
                        keyboardType="phone-pad"
                        autoFocus={true}
                        style={{paddingLeft: 16, height: 48}}
                        className="bg-general dark:bg-secondaryBlack mb-1 font-medium dark:text-general text-secondaryGray w-full py-4 border border-tertiaryGray   rounded-xl focus:border dark:focus:border-tertiaryGray focus:border-green-600/40"

                    />

                    {error ? (
                        <View style={{marginBottom: 16}} className="mb-6 w-full items-start">
                            <Text className="text-sm font-GoogleSansMedium text-red-600">
                                {error}
                            </Text>
                        </View>
                    ) : <View className="mb-6 w-full items-start">
                        <Text className="text-sm font-GoogleSansRegular dark:text-tertiaryGray">This is the number that is currently logged in.</Text>
                    </View>}


                    <View className="w-full py-2">
                        <Text className="text-xl  tracking-tight font-GoogleSansMedium dark:text-general">Enter new phone number?</Text>
                    </View>

                    <TextInput
                        maxLength={10}
                        value={newValue}
                        onChangeText={validateNewNumber}
                        autoCorrect={false}
                        autoCapitalize="none"
                        keyboardType="phone-pad"
                        style={{paddingLeft: 16, height: 48 }}
                        className="bg-general dark:bg-secondaryBlack mb-1 font-medium dark:text-general text-secondaryGray w-full py-4 border border-tertiaryGray   rounded-xl focus:border dark:focus:border-tertiaryGray focus:border-green-600/40"

                    />


                    {newError ? (
                        <View className="mb-6 w-full items-start">
                            <Text className="text-sm font-GoogleSansMedium text-red-600">
                                {newError}
                            </Text>
                        </View>
                    ) :
                        <View className="mb-6 w-full flex flex-row  items-center">
                            <Ionicons style={{paddingRight: 5, }} name="checkmark-circle-sharp" size={16} color="green"/>
                            <Text className="text-sm font-GoogleSansRegula flex-shrink dark:text-tertiaryGray">To proceed, confirm that your new phone number can receive SMS or calls.</Text>
                    </View>}


                    {isDisabled?
                        (<DisabledPrimaryButton name="Change phone number" />)
                        :
                        (<PrimaryButton name="Change phone number" disabled={isDisabled} onPress={handleChangePhoneNumber}/>)

                    }
                </View>

            </KeyboardAwareScrollView>
            <KeyboardToolbar/>

        </View>
    )
}
export default ChangeOldPhoneNumber
