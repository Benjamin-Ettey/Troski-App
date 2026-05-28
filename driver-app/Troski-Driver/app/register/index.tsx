import {View, Text, TouchableOpacity} from 'react-native'
import React, {useState} from 'react'
import {KeyboardAwareScrollView, KeyboardToolbar} from "react-native-keyboard-controller";
import {StatusBar} from "expo-status-bar";
import FullNameInput from "@/components/FullNameInput";
import EmailInput from "@/components/EmailInput";
import PhoneNumberInput from "@/components/PhoneNumberInput";
import CityInput from "@/components/CityInput";
import {Ionicons} from "@expo/vector-icons";
import DisabledPrimaryButton from "@/components/DisabledPrimaryButton";
import PrimaryButton from "@/components/PrimaryButton";
import {useRouter} from "expo-router";
import {useAppStore} from "@/utils/store";

const Index = () => {

    const [termsCheckbox, setTermsCheckbox] = useState(false);

    const driverfullname = useAppStore((state)=> state.driverfullname);
    const driveremail = useAppStore((state)=> state.driveremail);
    const drivernumber = useAppStore((state)=> state.drivernumber);
    const city = useAppStore((state)=> state.city);

    const setDriverFullName = useAppStore((state)=> state.setDriverFullName);
    const setDriverEmail = useAppStore((state)=> state.setDriverEmail);
    const setDriverNumber = useAppStore((state)=> state.setDriverNumber);
    const setCity = useAppStore((state)=> state.setCity);

    const handleDriverFullName = (fullname: string) => {
        setDriverFullName(fullname);
    };

    const handleDriverEmail = (email: string) =>{
        setDriverEmail(email);
    };

    const handleDriverNumber = (number: string) => {
        setDriverNumber(number);
    };

    const handleCity = (city: string) => {
        setCity(city);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const isDisabled =
        !driverfullname ||
        driverfullname.length <= 3 ||
        !emailRegex.test(driveremail || "") ||
        !drivernumber ||
        drivernumber.length < 9 ||
        !city ||
        city.length < 2 ||
        !termsCheckbox;

    const handleCreateAccount = () =>{
        router.push("/register/identityVerification")
    };

    const router = useRouter();




    return (

        <View className="flex-1  bg-general">
            <KeyboardAwareScrollView
                bottomOffset={200}
                contentContainerStyle={{paddingBottom: 100}}
                keyboardShouldPersistTaps="handled"
                className="flex-1">

                <StatusBar style="dark"/>

                <View className="w-full flex-1 flex items-center px-6">

                    <View className="w-full py-6 flex-col gap-2">
                        <Text className="text-3xl leading-none tracking-tighter text-secondaryBlack  font-GoogleSansMedium">Become a Troski Driver</Text>
                        <Text className="text-base leading-none tracking-tight text-secondaryBlack  font-GoogleSansRegular">Let&apos;s get you started.</Text>
                    </View>

                    <View className="w-full flex flex-col justify-center items-start gap-6 pt-8">
                        <View className="w-full gap-2">
                            <View className="w-full flex flex-row  items-center gap-2">
                                <Text
                                    style={{paddingLeft: 8, }}
                                    className="text-base leading-none tracking-tight  text-secondaryBlack  font-GoogleSansMedium">Full Name
                                </Text>
                                <Ionicons name="star" size={6} color="red"/>
                            </View>


                            <FullNameInput
                                value={driverfullname}
                                onChangeText={handleDriverFullName}
                            />

                        </View>

                        <View className="w-full gap-2">
                            <View className="w-full flex flex-row  items-center gap-2">
                                <Text
                                    style={{paddingLeft: 8, }}
                                    className="text-base leading-none tracking-tight  text-secondaryBlack  font-GoogleSansMedium">Email
                                </Text>
                                <Ionicons name="star" size={6} color="red"/>
                            </View>
                            <EmailInput
                                value={driveremail}
                                onChangeText={handleDriverEmail}
                            />


                        </View>

                        <View className="w-full gap-2">
                            <View className="w-full flex flex-row  items-center gap-2">
                                <Text
                                    style={{paddingLeft: 8, }}
                                    className="text-base leading-none tracking-tight  text-secondaryBlack  font-GoogleSansMedium">Phone Number
                                </Text>
                                <Ionicons name="star" size={6} color="red"/>
                            </View>
                            <PhoneNumberInput
                                value={drivernumber}
                                onChangeText={handleDriverNumber}/>

                        </View>

                        <View className="w-full gap-2">
                            <View className="w-full flex flex-row  items-center gap-2">
                                <Text
                                    style={{paddingLeft: 8, }}
                                    className="text-base leading-none tracking-tight  text-secondaryBlack  font-GoogleSansMedium">City
                                </Text>
                                <Ionicons name="star" size={6} color="red"/>
                            </View>
                            <CityInput
                                value={city}
                                onChangeText={handleCity}
                            />

                        </View>


                        <View className="w-full flex flex-row gap-2 items-center">
                            <TouchableOpacity hitSlop={12} onPress={() => setTermsCheckbox((prev) => !prev)}>
                                    <Ionicons name={termsCheckbox? "checkbox" : "square-outline"} size={16} color="black"/>
                            </TouchableOpacity>

                            <Text className="text-sm leading-none text-secondaryBlack/50 text-left flex-shrink font-GoogleSansRegular">
                                By registering, you agree to our Terms of Service & Privacy Policy, comply with obligations.
                            </Text>

                        </View>

                        <View className="w-full flex flex-row gap-2 items-center">
                            <Ionicons name="notifications" size={16} color="black"/>

                            <Text className="text-sm leading-none text-secondaryBlack/50 text-left flex-shrink font-GoogleSansRegular">
                                Once you become a Troski Driver, we will occasionally send you offers and promotions related to our services. You can always unsubscribe by changing your communication preferences.
                            </Text>

                        </View>

                        <View className="w-full flex justify-center mt-4 gap-2 items-center">

                            {isDisabled?
                                <DisabledPrimaryButton
                                    name="Create account"
                                />
                                :
                                <PrimaryButton
                                    name="Create account"
                                    onPress={handleCreateAccount}
                                    disabled={isDisabled}
                                />
                            }

                        </View>


                    </View>

                </View>


            </KeyboardAwareScrollView>
            <KeyboardToolbar/>
        </View>
    )
}
export default Index
