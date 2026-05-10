import React from 'react'
import {router, Stack} from "expo-router";
import {TouchableOpacity} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {KeyboardProvider} from "react-native-keyboard-controller";
import {GestureHandlerRootView} from "react-native-gesture-handler";
import {BottomSheetModalProvider} from "@gorhom/bottom-sheet";

const _Layout = () => {


    return (
        <GestureHandlerRootView>
            <BottomSheetModalProvider>
                <KeyboardProvider>
                    <Stack>
                        <Stack.Screen
                            name="index"
                            options={()=> ({
                                headerShadowVisible: false,
                                headerStyle: {backgroundColor: "#F5F7FA"},
                                headerTitle: 'Edit profile',
                                headerLeft: ()=>(
                                    <TouchableOpacity onPress={()=>router.back()} style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
                                        <Ionicons name="chevron-back" size={30} color="black"/>
                                    </TouchableOpacity>
                                )
                            })}
                        />


                        <Stack.Screen
                            name="changePhoneNumber"
                            options={()=> ({
                                headerShown: false
                            })}
                        />




                    </Stack>
                </KeyboardProvider>
            </BottomSheetModalProvider>
        </GestureHandlerRootView>
    )
}
export default _Layout
