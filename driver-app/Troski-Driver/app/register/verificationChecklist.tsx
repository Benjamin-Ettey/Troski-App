import {View, Text, Modal, TouchableOpacity, Image} from 'react-native'
import React, {useState} from 'react'
import {Ionicons} from "@expo/vector-icons";
import {useRouter} from "expo-router";
import {SafeAreaView} from "react-native-safe-area-context";
import {StatusBar} from "expo-status-bar";
import {LinearGradient} from "expo-linear-gradient";
import PrimaryButton from "@/components/PrimaryButton";
import {AnimatedView} from "react-native-reanimated/src/component/View";
import {FadeInUp} from "react-native-reanimated";

const VerificationChecklist = () => {
    const [ showChecklist, setShowChecklist ] = useState(true);
    const router = useRouter();

    const handleShowChecklist = ()=> {
        setShowChecklist(false);
        router.replace("/register/vehicleDetails")
    };

    return (

        <SafeAreaView className="flex-1 bg-general ">
            <StatusBar style="light"/>
            <Modal visible={showChecklist} animationType="fade">
                <View style={{flex: 1}}>


                <Image
                    source={require("../../assets/images/trotro.webp")}
                    resizeMode="cover"
                    className="w-full flex-1"

                />



                <LinearGradient
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                    }}
                    colors={[
                        "rgba(0,0,0,0.2)",
                        "rgba(0,0,0,0.6)",
                        "rgba(0,0,0,0.9)",
                    ]}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                />


                <View className="absolute top-2 left-2 px-6">

                    <View className="mt-12">
                        <TouchableOpacity onPress={handleShowChecklist} style={{width: 42, height: 42}} className=" p-2 justify-center items-center bg-tertiaryWhite rounded-full" >
                            <Ionicons name="close" size={24} color="black"/>
                        </TouchableOpacity>
                    </View>


                    <AnimatedView
                        entering={FadeInUp.delay(200).duration(700)}
                        className="mt-96 gap-2">
                        <Text className="text-3xl leading-none tracking-tighter text-general  font-GoogleSansMedium">Complete your registration to start driving</Text>
                        <Text className="text-base leading-none tracking-tight text-general  font-GoogleSansRegular">You are almost ready to start driving.</Text>

                    </AnimatedView>


                    <View className="flex flex-col w-full gap-1 mt-5">

                        <AnimatedView
                            entering={FadeInUp.delay(200).duration(700)}
                            className="w-full flex flex-row justify-start items-end gap-2">
                            <Ionicons name="checkbox" size={16} color="#ffcc00"/>
                            <Text className="text-base leading-none tracking-tight text-general  font-GoogleSansRegular">
                                Phone number verified
                            </Text>

                        </AnimatedView>

                        <AnimatedView
                            entering={FadeInUp.delay(300).duration(700)}
                            className="w-full flex flex-row justify-start items-end gap-2">
                            <Ionicons name="checkbox" size={16} color="#ffcc00"/>
                            <Text className="text-base leading-none tracking-tight text-general  font-GoogleSansRegular">
                                Email added
                            </Text>

                        </AnimatedView>

                        <AnimatedView
                            entering={FadeInUp.delay(400).duration(700)}
                            className="w-full flex flex-row justify-start items-end gap-2">
                            <Ionicons name="checkbox" size={16} color="#ffcc00"/>
                            <Text className="text-base leading-none tracking-tight text-general  font-GoogleSansRegular">
                                Identity verification
                            </Text>

                        </AnimatedView>

                        <AnimatedView
                            entering={FadeInUp.delay(500).duration(700)}
                            className="w-full flex flex-row justify-start items-end gap-2">
                            <Ionicons name="close-circle" size={16} color="#ffffff"/>
                            <Text className="text-base leading-none tracking-tight text-general  font-GoogleSansRegular">
                                Vehicle details
                            </Text>

                        </AnimatedView>

                        <AnimatedView
                            entering={FadeInUp.delay(600).duration(700)}
                            className="w-full flex flex-row justify-start items-end gap-2">
                            <Ionicons name="close-circle" size={16} color="#ffffff"/>
                            <Text className="text-base leading-none tracking-tight text-general  font-GoogleSansRegular">
                                Vehicle documents
                            </Text>

                        </AnimatedView>

                        <AnimatedView
                            entering={FadeInUp.delay(700).duration(700)}
                            className="w-full flex flex-row justify-start items-end gap-2">
                            <Ionicons name="close-circle" size={16} color="#ffffff"/>
                            <Text className="text-base leading-none tracking-tight text-general  font-GoogleSansRegular">
                                Route preference
                            </Text>

                        </AnimatedView>

                        <AnimatedView
                            entering={FadeInUp.delay(800).duration(700)}
                            className="w-full flex flex-row justify-start items-end gap-2">
                            <Ionicons name="close-circle" size={16} color="#ffffff"/>
                            <Text className="text-base leading-none tracking-tight text-general  font-GoogleSansRegular">
                                Setup payment
                            </Text>

                        </AnimatedView>

                    </View>



                </View>

                <View className="w-full justify-center items-center bottom-12 absolute">
                    <PrimaryButton
                        name="Continue"
                        disabled={false}
                        onPress={()=>router.replace("/register/vehicleDetails")}
                    />
                </View>

                </View>
            </Modal>
        </SafeAreaView>


    )
}
export default VerificationChecklist
