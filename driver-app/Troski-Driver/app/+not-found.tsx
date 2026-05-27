import {View, Text, TouchableOpacity} from 'react-native'
import React from 'react'
import { router} from "expo-router";

const NotFound = () => {
    return (
        <View className="flex-1 justify-center items-center px-6 bg-general dark:bg-secondaryBlack">
            <Text className="text-2xl font-GoogleSansBold text-secondaryBlack dark:text-general">
                Page not found
            </Text>

            <Text className="text-center font-GoogleSansRegular text-secondaryGray dark:text-tertiaryGray">
                The screen you’re looking for doesn’t exist.
            </Text>

            <TouchableOpacity
                onPress={() => {
                    if (router.canGoBack()) {
                        router.back();
                    } else {
                        router.replace("/");
                    }
                }}
                style={{ paddingHorizontal: 16, paddingVertical: 12 }}
                className="mt-5 bg-primary rounded-full"
            >
                <Text className="text-secondaryBlack font-GoogleSansBold">
                    Go back
                </Text>
            </TouchableOpacity>
        </View>
    )
}
export default NotFound
