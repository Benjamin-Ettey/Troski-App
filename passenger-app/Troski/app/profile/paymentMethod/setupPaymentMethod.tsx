import {View, Text, TextInput, TouchableOpacity} from 'react-native'
import React, {useState} from 'react'
import {KeyboardAwareScrollView, KeyboardToolbar} from "react-native-keyboard-controller";
import {StatusBar} from "expo-status-bar";
import {router} from "expo-router";
import PrimaryButton from "@/components/PrimaryButton";
import {useAppStore} from "@/utils/store";
import {Ionicons} from "@expo/vector-icons";

const SetupPaymentMethod = () => {
    const [selectedValue, setSelectedValue] = useState("Select service provider");
    const [open, setOpen] = useState(false);


    const [value, setValue] = useState('');
    const [error, setError] = useState('');


    const setNumber = useAppStore((state) => state.setNumber);
    const setServiceProvider = useAppStore((state)=> state.setServiceProvider)

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

    const addPaymentMethod = useAppStore((state) => state.addPaymentMethod);

    const handleSetup = () => {
        if (value.length !== 10) {
            setError('Enter a valid 10-digit number');
            return;
        }

        addPaymentMethod({
            number: value,
            provider: selectedValue,
        });

        router.back();
    };



    return (
        <View style={{backgroundColor: "#F5F7FA", flex: 1}} className="w-full">
            <KeyboardAwareScrollView
                keyboardShouldPersistTaps="handled"
                className="flex-1">
                <StatusBar style="dark"/>




                <View className="w-full flex-1 flex items-center px-6">

                    <View className="w-full">
                        <Text className="text-xl tracking-tight font-GoogleSansMedium">Select Service Provider</Text>
                    </View>

                    <TouchableOpacity
                        onPress={()=> setOpen(!open)}
                        style={{paddingLeft: 16, height: 48, marginBottom: 16 }}
                        className=" mb-1 flex flex-row justify-between font-GoogleSansRegular text-secondaryGray w-full py-4 border border-green-600/40  rounded-xl ">
                        <Text>{selectedValue}</Text>
                        <Ionicons style={{paddingRight: 16}} name="chevron-down" size={16} color="black"/>
                    </TouchableOpacity>

                    {open && (
                        <View style={{marginBottom: 10, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 16, backgroundColor: "#a9a9a922"}} className="w-full gap-2 font-GoogleSansMedium border border-tertiaryGray">
                            {["MTN", "Telecel", "Airtel/Tigo"].map((item) => (

                                    <Text
                                        style={{ height: 32, }}
                                        className="w-full font-GoogleSansRegular flex text-xl"
                                        key={item}
                                        onPress={() => {
                                            setSelectedValue(item);
                                            setOpen(false);
                                        }}
                                    >
                                        {item}
                                    </Text>

                            ))}
                        </View>

                    )

                    }

                    <View className="w-full">
                        <Text className="text-xl tracking-tight font-GoogleSansMedium">Phone number</Text>
                    </View>

                    <TextInput
                        maxLength={10}
                        value={value}
                        onChangeText={validate}
                        autoCorrect={false}
                        autoCapitalize="none"
                        keyboardType="phone-pad"
                        autoFocus={true}
                        style={{paddingLeft: 16, }}
                        className=" mb-1 font-medium text-secondaryGray w-full py-4 border border-tertiaryGray  rounded-xl focus:border focus:border-green-600/40"

                    />


                    {error ? (
                        <View className="mb-6 w-full items-start">
                            <Text className="text-sm font-GoogleSansMedium text-red-600">
                                {error}
                            </Text>
                        </View>
                    ) : <View className="mb-6 w-full items-start">
                        <Text className="text-sm font-GoogleSansRegular">This number will be used for payment transactions.</Text>
                    </View>}

                    <PrimaryButton name="Setup" disabled={value.length !== 10 } onPress={handleSetup}/>
                </View>

            </KeyboardAwareScrollView>
            <KeyboardToolbar/>
        </View>

    )
}
export default SetupPaymentMethod
