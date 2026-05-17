import {View, Text, TouchableOpacity} from 'react-native'
import React from 'react'
import {Ionicons} from "@expo/vector-icons";
import {useColorScheme} from "nativewind";

const NavBar = ({name, title, textcolor, color, goforwardcolor, onPress} : any) => {

    return (

        <TouchableOpacity
            onPress={onPress}
            style={{paddingHorizontal: 16, paddingVertical: 16}}
            className="flex flex-row justify-between items-center">
            <View className="flex flex-row justify-start items-center gap-4">
                <Ionicons name={name} size={20} color={color}/>
                <Text style={{color: textcolor}} className="text-md font-GoogleSansMedium text-secondaryBlack dark:text-general">{title}</Text>
            </View>

            <Ionicons name="chevron-forward" size={20} color={goforwardcolor}/>
        </TouchableOpacity>
    )
}
export default NavBar

