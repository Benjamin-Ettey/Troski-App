import { TouchableOpacity} from 'react-native'
import React from 'react'
import {MaterialIcons} from "@expo/vector-icons";

const MenuButton = ({onPress}) => {
    return (
        <TouchableOpacity onPress={onPress} className="bg-white py-4 px-2 rounded-full flex items-center justify-center shadow-md shadow-secondaryWhite">
            <MaterialIcons name="menu" size={24} color="black" />
        </TouchableOpacity>
    )
}
export default MenuButton
