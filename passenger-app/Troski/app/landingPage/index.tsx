import { View, Text, Image } from "react-native";
import React from "react";
import { StatusBar } from "expo-status-bar";
import PrimaryButton from "@/components/PrimaryButton";
import SecondaryButton from "@/components/SecondaryButton";
import { router } from "expo-router";

const Index = () => {


    return (
        <View className="flex-1 bg-general">
            <StatusBar style="light" />


            <Image
                source={require("../../assets/images/landingImage.png")}
                resizeMode="cover"
                className="w-full h-[68%]"

            />

            <View
                className="absolute bottom-0 rounded-t-3xl w-full h-[40%] dark:bg-secondaryBlack bg-general pt-6 pb-14"
            >
                <View className="flex-1 justify-between items-center">


                    <View className="max-w-64 items-center">
                        <View className="w-16 h-16 rounded-full p-2 mb-3">
                            <Image
                                source={require("../../assets/images/favicon.png")}
                                resizeMode="contain"
                                style={{ width: "100%", height: "100%" }}
                            />
                        </View>

                        <Text
                            numberOfLines={2}
                            adjustsFontSizeToFit
                            minimumFontScale={0.7}
                            className="text-secondaryBlack dark:text-general text-3xl leading-8 font-GoogleSansMedium text-center tracking-tight"
                        >
                            Book your rides on the go.
                        </Text>
                    </View>

                    {/* BUTTONS */}
                    <View className="w-full items-center gap-3">
                        <PrimaryButton
                            disabled={false}
                            name="Sign up for free"
                            onPress={() => router.push("/landingPage/signup")}
                        />

                        <SecondaryButton
                            title="Login"
                            onPress={() => router.push("/landingPage/login")}
                        />
                    </View>
                </View>
            </View>
        </View>
    );
};

export default Index;