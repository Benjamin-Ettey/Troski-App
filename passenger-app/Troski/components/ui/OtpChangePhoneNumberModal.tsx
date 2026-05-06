import {View, Modal, Text} from 'react-native'
import React, {useEffect, useState} from 'react'
import {router} from "expo-router";
import {StatusBar} from "expo-status-bar";
import LottieView from "lottie-react-native";


const OtpChangePhoneNumber = () => {


    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            router.replace("/homepage/home");
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <Modal
            visible={visible}
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
                        <Text className="text-xl font-GoogleSansMedium mb-2 text-center flex-shrink">Phone Number Updated Successful!</Text>
                        <Text className="text-sm font-GoogleSansRegular text-center flex-shrink">Please be patient...</Text>
                        <Text className="text-sm font-GoogleSansRegular text-center flex-shrink">You will be redirected to the homepage</Text>
                    </View>



                </View>
            </View>
        </Modal>
    )
}
export default OtpChangePhoneNumber
