import {TouchableOpacity, View} from 'react-native'
import React from 'react'
import {router, Stack} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import {useColorScheme} from "nativewind";

const RequestRefundRoute = () => {

    const { colorScheme } = useColorScheme();

    return (
        <View  style={{flex:1 , backgroundColor: colorScheme === "dark"? "#000000": "#ffffff"}}>

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
                        headerTitle: 'Request refund',
                        headerLeft: ()=>(
                            <TouchableOpacity onPress={()=>router.back()} style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
                                <Ionicons name="chevron-back" size={30} color={colorScheme==="dark"? "white": "black"}/>
                            </TouchableOpacity>
                        )
                    })}
                />
            </Stack>
        </View>
    )
}
export default RequestRefundRoute
