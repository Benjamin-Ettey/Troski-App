import React, { useMemo, useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
} from "react-native";

type Props = {
    value: string;
    onChangeText: (city: string) => void;
};

const cities = [
    "Accra",
    "Kumasi",
    "Takoradi",
    "Tamale",
    "Cape Coast",
    "Ho",
    "Koforidua",
    "Sunyani",
    "Kasoa",
    "Tema",
];

const CityInput = ({ value, onChangeText }: Props) => {
    const [focused, setFocused] = useState(false);

    const filteredCities = useMemo(() => {
        if (!value) return cities;

        return cities.filter((city) =>
            city.toLowerCase().includes(value.toLowerCase())
        );
    }, [value]);

    const error =
        value.length > 0 && value.length < 2
            ? "Please enter a valid city"
            : "";

    return (
        <View className="flex-col relative">
            {/* Input */}
            <View
                className={`h-14 w-full bg-tertiaryGray/10 flex-row items-center rounded-2xl px-4 ${
                    error ? "border border-red-600" : ""
                }`}
            >
                <TextInput
                    value={value}
                    onChangeText={onChangeText}
                    style={{paddingLeft: 4, textAlign: "left", fontSize: 16}}
                    placeholder="Enter your city"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="words"
                    textAlignVertical="center"
                    className="w-full text-secondaryBlack"
                    onFocus={() => setFocused(true)}
                />
            </View>

            {/* Dropdown */}
            {focused && filteredCities.length > 0 && (
                <View className="w-full bg-white rounded-2xl mt-2 border border-gray-200 max-h-52 overflow-hidden">
                    <View>
                        {filteredCities.map((item) => (
                            <TouchableOpacity
                                key={item}
                                activeOpacity={0.7}
                                className="px-4 py-4 border-b border-gray-100"
                                onPress={() => {
                                    onChangeText(item);
                                    setFocused(false);
                                }}
                            >
                                <Text className="text-base text-secondaryBlack">
                                    {item}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            {/* Error */}
            {error ? (
                <Text
                    style={{ paddingLeft: 8 }}
                    className="text-xs leading-none text-red-600 mt-2"
                >
                    {error}
                </Text>
            ) : null}
        </View>
    );
};

export default CityInput;