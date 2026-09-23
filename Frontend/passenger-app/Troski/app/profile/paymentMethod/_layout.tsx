import React from 'react'
import {router, Stack} from "expo-router";
import {TouchableOpacity, View} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {KeyboardProvider} from "react-native-keyboard-controller";
import {GestureHandlerRootView} from "react-native-gesture-handler";
import {BottomSheetModalProvider} from "@gorhom/bottom-sheet";
import {useColorScheme} from "nativewind";

const PaymentMethodRoute = () => {

    const { colorScheme } = useColorScheme();

    return (
        <GestureHandlerRootView>
            <BottomSheetModalProvider>
                <KeyboardProvider>
                    <View style={{flex:1 , backgroundColor: colorScheme === "dark"? "#000000": "#ffffff"}}>

                        <Stack>
                            <Stack.Screen
                                name="index"
                                options={()=> ({
                                    headerShadowVisible: false,
                                    headerStyle: {
                                        backgroundColor:
                                            colorScheme === "dark" ? "#000000" : "#F5F7FA",
                                    },
                                    headerTintColor:
                                        colorScheme === "dark" ? "#FFFFFF" : "#000000",
                                    headerTitle: 'Payment method',
                                    headerLeft: ()=>(
                                        <TouchableOpacity onPress={()=>router.back()} style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
                                            <Ionicons name="chevron-back" size={30} color={colorScheme==="dark"? "white": "black"}/>
                                        </TouchableOpacity>
                                    )
                                })}
                            />

                            <Stack.Screen
                                name="setupPaymentMethod"
                                options={()=> ({
                                    headerShadowVisible: false,
                                    headerStyle: {
                                        backgroundColor:
                                            colorScheme === "dark" ? "#000000" : "#F5F7FA",
                                    },
                                    headerTintColor:
                                        colorScheme === "dark" ? "#FFFFFF" : "#000000",
                                    headerTitle: 'Setup payment method',
                                    headerLeft: ()=>(
                                        <TouchableOpacity onPress={()=>router.back()} style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
                                            <Ionicons name="chevron-back" size={30} color={colorScheme==="dark"? "white": "black"}/>
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
export default PaymentMethodRoute
