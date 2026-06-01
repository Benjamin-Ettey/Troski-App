import {View, Modal, Text} from 'react-native'
import React, {useEffect} from 'react'
import {useRouter} from "expo-router";
import {StatusBar} from "expo-status-bar";
import LottieView from "lottie-react-native";


const OtpModal = () => {
    const router = useRouter();

    useEffect(() => {
        const timer = setTimeout(()=>{

            router.replace("/")
        }, 3000)

        return () => clearTimeout(timer);
    }, []);

    return (
        <Modal
            visible={true}
            animationType="fade"
            className="relative flex-1 w-full bg-general"
        >
            <StatusBar style="dark" />
            <View
                style={{height: "100%", bottom: 0, borderTopRightRadius: 32, borderTopLeftRadius: 32}}
                className="bg-general  w-full absolute ">
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
                            <Text className="text-xl leading-none font-GoogleSansMedium mb-2 ">Verification Successful!</Text>
                            <Text className="text-sm leading-none font-GoogleSansRegular ">Please be patient...</Text>
                            <Text className="text-sm leading-none font-GoogleSansRegular ">You will be redirected to the homepage.</Text>
                        </View>



                </View>
            </View>
        </Modal>
    )
}
export default OtpModal
