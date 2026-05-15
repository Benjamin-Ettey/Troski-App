import {View, Modal, Text} from 'react-native'
import React, {useEffect} from 'react'
import {router} from "expo-router";
import {StatusBar} from "expo-status-bar";
import LottieView from "lottie-react-native";
import {useAppStore} from "@/utils/store";


const OtpModal = () => {
    const setLoggedIn = useAppStore((state)=>state.setLoggedIn);
    const setSeeProfile = useAppStore((state)=>state.setSeeProfile);


    useEffect(() => {
        const timer = setTimeout(()=>{
            setLoggedIn(true);
            setSeeProfile(true);
            router.replace("/homepage")
        }, 3000)

        return () => clearTimeout(timer);
    }, []);

    return (
        <Modal
            visible={true}
            animationType="fade"
            className="relative flex-1 w-full dark:bg-secondaryBlack"
        >
            <StatusBar style="auto" />
            <View
                style={{height: "100%", bottom: 0, borderTopRightRadius: 32, borderTopLeftRadius: 32}}
                className="bg-general dark:bg-secondaryBlack w-full absolute ">
                <View
                    className="flex-1 flex justify-center items-center w-full relative">


                        <LottieView
                            source={require("../../assets/video/loading.json")}
                            style={{width: "100%", height: "100%", marginTop: "-20%"}}
                            autoPlay
                            loop

                        />

                        <View
                            style={{marginTop: "50%"}}
                            className="w-full flex justify-center items-center absolute">
                            <Text className="text-xl font-GoogleSansMedium mb-2 dark:text-general">Verification Successful!</Text>
                            <Text className="text-sm font-GoogleSansRegular dark:text-tertiaryWhite">Please be patient...</Text>
                            <Text className="text-sm font-GoogleSansRegular dark:text-tertiaryWhite">You will be redirected to the homepage.</Text>
                        </View>



                </View>
            </View>
        </Modal>
    )
}
export default OtpModal
