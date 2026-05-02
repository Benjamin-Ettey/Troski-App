import {View, Text, Modal, Image} from 'react-native'
import React, {useEffect} from 'react'
import {router} from "expo-router";
import {StatusBar} from "expo-status-bar";
import {useVideoPlayer, VideoView} from "expo-video";


const OtpModal = () => {

    const player = useVideoPlayer(require('../../assets/video/loader.mp4'), (player) => {
        player.loop = true;
        player.play();
    });


    useEffect(() => {
        const timer = setTimeout(()=>{
            router.replace("../homepage/home")
        }, 4000)

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
                className="bg-general w-full absolute shadow-2xl shadow-tertiaryGray">
                <View
                    style={{marginTop: "-20%"}}
                    className="flex-1 flex justify-center items-center w-full">
                    <View
                        style={{padding: "12%"}}
                        className="rounded-full flex justify-center items-center mb-8 bg-primary">
                        <Image
                            source={require("../../assets/images/keyImage.png")}
                            style={{width: 64, height: 64}}
                            resizeMode="contain"
                        />
                    </View>
                    <View className="mb-4 w-full flex justify-center items-center">
                        <Text className="text-xl font-medium mb-4">Verification Successful!</Text>
                        <Text className="text-sm ">Please wait...</Text>
                        <Text className="text-sm ">You will be redirected to the homepage.</Text>
                    </View>


                    <View className="w-full flex justify-center items-center">
                        {/*<Video*/}
                        {/*    source={require("../../assets/video/loader.mp4")}*/}
                        {/*    style={{width: 100, height: 100}}*/}
                        {/*    shouldPlay={true}*/}
                        {/*    isLooping={true}*/}
                        {/*/>*/}

                        <VideoView
                            style={{width: 100, height: 100}}
                            player={player}/>

                    </View>


                </View>
            </View>
        </Modal>
    )
}
export default OtpModal
