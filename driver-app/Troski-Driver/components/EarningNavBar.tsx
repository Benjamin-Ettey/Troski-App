import {View, Text, Image} from 'react-native'
import React from 'react'


const EarningNavBar = () => {

    return (

        <View>


            <View className="bg-tertiaryWhite  w-full h-20 px-4 rounded-3xl flex flex-row justify-between items-center">
                <View className="flex flex-row gap-4 justify-start items-center">

                    <Image
                        source={require("../assets/images/money.webp")}
                        style={{width: 64, height: 64}}
                    />
                    <View className="flex flex-col ">
                        <Text numberOfLines={1} className="text-xl leading-6 tracking-tight text-secondaryBlack  font-GoogleSansMedium">Today&apos;s earning</Text>
                        <Text numberOfLines={1} className="text-xs leading-tight text-secondaryBlack font-GoogleSansRegular">Recent earnings as of today</Text>

                    </View>
                </View>

                <View className="flex-1 h-8 items-end">
                    <Text className="text-base leading-tight tracking-tight text-secondaryBlack  font-GoogleSansMedium">GH₵2000</Text>
                </View>


            </View>
        </View>

    )
}
export default EarningNavBar
