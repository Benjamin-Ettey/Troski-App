import {View, Modal, Text} from 'react-native'
import React, {useEffect} from 'react'
import {router} from "expo-router";
import {StatusBar} from "expo-status-bar";
import LottieView from "lottie-react-native";


const OtpModal = () => {


    useEffect(() => {
        const timer = setTimeout(()=>{
            router.replace("../homepage/home")
        }, 3000)

        return () => clearTimeout(timer);
    }, []);

    return (
        <Modal
            visible={true}
            animationType="fade"
            className="relative flex-1 w-full"
        >
            <StatusBar style="dark" />
            <View
                style={{height: "95%", bottom: 0, borderTopRightRadius: 32, borderTopLeftRadius: 32}}
                className="bg-general w-full absolute shadow-xl shadow-tertiaryGray">
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
                            <Text className="text-xl font-medium mb-2">Verification Successful!</Text>
                            <Text className="text-sm ">Please be patient...</Text>
                            <Text className="text-sm ">You will be redirected to the homepage.</Text>
                        </View>



                </View>
            </View>
        </Modal>
    )
}
export default OtpModal
