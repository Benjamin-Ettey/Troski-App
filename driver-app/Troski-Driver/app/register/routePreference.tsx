import React, { useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from "@/utils/store";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { StatusBar } from "expo-status-bar";
import PrimaryButton from "@/components/PrimaryButton";
import { useRouter } from "expo-router";
import DisabledPrimaryButton from "@/components/DisabledPrimaryButton";

export default function RoutePreferences() {
    const { routes, addRoute, updateRoute } = useAppStore();

    const fromInputRefs = useRef<(TextInput | null)[]>([]);
    const toInputRefs = useRef<(TextInput | null)[]>([]);

    const router = useRouter();

    const isDisabled =
        routes.length === 0 ||
        routes.some(
            (route: any) =>
                !route.from?.trim() ||
                !route.to?.trim()
        );

    const handleRoutePreference = () => {
        router.push("/register/setupPayment");
    };

    return (
        <View className="flex-1 bg-general">
            <KeyboardAwareScrollView
                bottomOffset={200}
                contentContainerStyle={{ paddingBottom: 100 }}
                keyboardShouldPersistTaps="handled"
                className="flex-1"
            >
                <StatusBar style="dark" />

                <View className="w-full flex-1 flex items-center px-6 mt-4">

                    {routes.map((route: any, index: number) => (
                        <View
                            key={index}
                            className="flex-row justify-between mb-4 gap-4"
                        >
                            <View className="flex-1 mr-2">
                                <Text
                                    style={{ marginLeft: 12 }}
                                    className="text-base font-GoogleSansMedium mb-1"
                                >
                                    From
                                </Text>

                                <TouchableOpacity
                                    activeOpacity={1}
                                    onPress={() => fromInputRefs.current[index]?.focus()}
                                    className="w-full h-14 bg-tertiaryGray/10 flex-row items-center rounded-2xl"
                                >
                                    <TextInput
                                        ref={(ref) => {
                                            fromInputRefs.current[index] = ref;
                                        }}
                                        className="text-secondaryBlack flex-1"
                                        style={{
                                            paddingLeft: 12,
                                            textAlign: "left",
                                            fontSize: 16,
                                        }}
                                        placeholder="Enter start"
                                        autoCorrect={false}
                                        value={route.from}
                                        onChangeText={(text) =>
                                            updateRoute(index, "from", text)
                                        }
                                    />
                                </TouchableOpacity>
                            </View>

                            <View className="flex-1">
                                <Text
                                    style={{ marginLeft: 12 }}
                                    className="text-base font-GoogleSansMedium mb-1"
                                >
                                    To
                                </Text>

                                <TouchableOpacity
                                    activeOpacity={1}
                                    onPress={() => toInputRefs.current[index]?.focus()}
                                    className="w-full h-14 bg-tertiaryGray/10 flex-row items-center rounded-2xl"
                                >
                                    <TextInput
                                        ref={(ref) => {
                                            toInputRefs.current[index] = ref;
                                        }}
                                        style={{
                                            paddingLeft: 12,
                                            textAlign: "left",
                                            fontSize: 16,
                                        }}
                                        className="text-secondaryBlack w-full"
                                        autoCorrect={false}
                                        placeholder="Enter destination"
                                        value={route.to}
                                        onChangeText={(text) =>
                                            updateRoute(index, "to", text)
                                        }
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}

                    <TouchableOpacity
                        className="items-center mt-2"
                        onPress={addRoute}
                    >
                        <Ionicons
                            name="add-circle"
                            size={40}
                            color="#ffcc00"
                        />
                    </TouchableOpacity>

                    <View className="w-full flex justify-center mt-6 gap-2 items-center">
                        {isDisabled ? (
                            <DisabledPrimaryButton
                                name="Continue"
                            />
                        ) : (
                            <PrimaryButton
                                name="Continue"
                                onPress={handleRoutePreference}
                                disabled={isDisabled}
                            />
                        )}
                    </View>

                </View>
            </KeyboardAwareScrollView>
        </View>
    );
}