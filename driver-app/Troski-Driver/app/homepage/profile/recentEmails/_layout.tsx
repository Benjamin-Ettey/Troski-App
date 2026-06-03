import {TouchableOpacity, View} from 'react-native'
import React from 'react'
import {router, Stack} from "expo-router";
import {Ionicons} from "@expo/vector-icons";

const RecentEmailRoute = () => {


    return (
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
                       headerTitle: 'Recent emails',
                       headerLeft: ()=>(
                           <TouchableOpacity onPress={()=>router.back()} style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
                               <Ionicons name="chevron-back" size={30} color="black"/>
                           </TouchableOpacity>
                       )
                   })}
               />
           </Stack>
        </View>
    )
}
export default RecentEmailRoute
