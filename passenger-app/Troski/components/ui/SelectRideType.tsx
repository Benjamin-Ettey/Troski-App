import { View, Text, FlatList, Pressable, Image } from "react-native";
import React, { useEffect, useState } from "react";
import { useAppStore } from "@/utils/store";
import {useColorScheme} from "nativewind";

const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return (R * c).toFixed(1);
};

interface SelectRideTypeProps {
    routeCoords?: any[];
    duration?: string;
    price?: string; // NEW: allow price to be passed in
}

const SelectRideType = ({ routeCoords, duration, price }: SelectRideTypeProps) => {
    const pickup = useAppStore((s) => s.pickupPoint);
    const destination = useAppStore((s) => s.destinationPoint);
    const pickupCoords = useAppStore((s) => s.pickupCoords);
    const destinationCoords = useAppStore((s) => s.destinationCoords);
    const { colorScheme } = useColorScheme();


    const [localDuration, setLocalDuration] = useState<string>(duration ?? "...");
    const [computedPrice, setComputedPrice] = useState<string>(price ?? "");

    useEffect(() => {
        if (duration) setLocalDuration(duration);
    }, [duration]);

    useEffect(() => {
        if (price) {
            setComputedPrice(price);
            return;
        }

        if (!pickupCoords || !destinationCoords) return;

        const km = haversineKm(
            pickupCoords.latitude,
            pickupCoords.longitude,
            destinationCoords.latitude,
            destinationCoords.longitude
        );

        setComputedPrice(`GH₵${(Number(km) * 3).toFixed(2)}`);
    }, [pickupCoords, destinationCoords, price]);

    useEffect(() => {
        const getDuration = async () => {
            if (!pickupCoords || !destinationCoords) return;

            try {
                const res = await fetch(
                    `https://maps.googleapis.com/maps/api/directions/json?origin=${pickupCoords.latitude},${pickupCoords.longitude}&destination=${destinationCoords.latitude},${destinationCoords.longitude}&key=YOUR_GOOGLE_MAPS_API_KEY`
                );

                const data = await res.json();
                const time = data.routes?.[0]?.legs?.[0]?.duration?.text;
                if (time) setLocalDuration(time);
            } catch (err) {
                console.log(err);
            }
        };

        if (!duration) getDuration();
    }, [pickupCoords, destinationCoords]);

    const km =
        pickupCoords && destinationCoords
            ? haversineKm(
                pickupCoords.latitude,
                pickupCoords.longitude,
                destinationCoords.latitude,
                destinationCoords.longitude
            )
            : "0";

    const data = [
        {
            id: 1,
            pickup: pickup || "Pickup",
            destination: destination || "Destination",
            price: computedPrice,
            speed: "FASTER",
            passengercount: 8,
            duration: localDuration,
        },
    ];

    return (
        <FlatList
            data={data}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => {
                return (
                    <Pressable
                        className="w-full px-5  gap-6 flex-1 flex flex-row justify-between items-center"
                    >

                        <View
                              className="w-full h-20 px-4 rounded-3xl bg-tertiaryWhite dark:bg-secondaryGray/20 border-2 border-secondaryGray flex flex-row justify-between items-center">
                        <View >
                            <Image
                                className="w-9 h-9"
                                source={require("../../assets/images/minibus.png")}
                            />
                        </View>

                        <View
                            className="flex flex-1 px-6 flex-col justify-center items-center "
                        >
                            <View className="flex flex-row justify-start items-center w-full gap-2">
                                <Text className="text-xl font-GoogleSansMedium dark:text-general">Troski</Text>
                            </View>

                            <View className="w-full flex flex-row items-center ">
                                <Text
                                    className="text-white px-2 py-0.5 text-xs leading-4 bg-black font-GoogleSansRegular rounded-full"
                                >
                                    {item.speed}
                                </Text>
                            </View>
                        </View>

                            <View
                                className="rounded-full w-24 h-9 bg-secondaryBlack flex justify-center items-center"
                            >
                                <Text numberOfLines={1} className="font-GoogleSansBold text-general dark:text-primary text-sm leading-4">
                                    {item.price}
                                </Text>
                            </View>
                        </View>
                    </Pressable>
                );
            }}
        />
    );
};

export default SelectRideType;
