import {View, Text, TouchableOpacity} from 'react-native'
import React from 'react'
import {Ionicons} from "@expo/vector-icons";

const NavBar = ({name, title, textcolor, color, goforwardcolor, onPress} : any) => {

    return (

        <TouchableOpacity
            onPress={onPress}
            className="flex flex-row h-14 px-4 justify-between items-center">
            <View className="flex flex-row justify-center items-center gap-4">
                <Ionicons name={name} size={18} color={color}/>
                <Text style={{color: textcolor}} className="text-base leading-5 font-GoogleSansMedium text-secondaryBlack dark:text-general">{title}</Text>
            </View>

            <Ionicons name="chevron-forward" size={18} color={goforwardcolor}/>
        </TouchableOpacity>
    )
}
export default NavBar

