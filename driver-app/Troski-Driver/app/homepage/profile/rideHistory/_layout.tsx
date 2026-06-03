import React from 'react'
import {router, Stack} from "expo-router";
import {TouchableOpacity, View} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {KeyboardProvider} from "react-native-keyboard-controller";
import {GestureHandlerRootView} from "react-native-gesture-handler";
import {BottomSheetModalProvider} from "@gorhom/bottom-sheet";

const RideHistoryRoute = () => {


    return (
        <GestureHandlerRootView>
            <BottomSheetModalProvider>
                <KeyboardProvider>
                    <View  style={{flex:1 , backgroundColor: "#ffffff"}}>

                        <Stack>
                            <Stack.Screen
                                name="index"
                                options={()=> ({
                                    headerShadowVisible: false,
                                    headerStyle: {
                                        backgroundColor: "#F5F7FA",
                                    },
                                    headerTintColor: "#000000",
                                    headerTitleAlign: "center",

                                    headerTitle: 'Ride history',
                                    headerLeft: ()=>(
                                        <TouchableOpacity onPress={()=>router.back()} style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
                                            <Ionicons name="chevron-back" size={30} color="black"/>
                                        </TouchableOpacity>
                                    )
                                })}
                            />



                        </Stack>
                    </View>
                </KeyboardProvider>
            </BottomSheetModalProvider>
        </GestureHandlerRootView>
    )
}
export default RideHistoryRoute
