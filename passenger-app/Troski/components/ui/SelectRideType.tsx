import { View, Text, FlatList, Pressable, Image } from "react-native";
import React, { useEffect, useState } from "react";
import { useAppStore } from "@/utils/store";

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
}

const SelectRideType = ({ routeCoords, duration }: SelectRideTypeProps) => {
    const pickup = useAppStore((s) => s.pickupPoint);
    const destination = useAppStore((s) => s.destinationPoint);
    const pickupCoords = useAppStore((s) => s.pickupCoords);
    const destinationCoords = useAppStore((s) => s.destinationCoords);

    const [localDuration, setLocalDuration] = useState<string>(duration ?? "...");

    useEffect(() => {
        if (duration) setLocalDuration(duration);
    }, [duration]);

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
            price: `GH₵${(Number(km) * 3).toFixed(2)}`,
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
                        style={{height: 72, borderRadius: 24, marginBottom: 12, paddingLeft: 20, paddingRight: 20, gap: 24}}
                        className="w-full bg-tertiaryWhite border border-secondaryBlack flex flex-row justify-between items-center">
                        <View>
                            <Image
                                source={require("../../assets/images/minibus.png")}
                                style={{width: 32, height: 32}}
                            />
                        </View>


                        <View
                            style={{width: "50%", gap: 2}}
                            className="flex flex-col justify-center items-center ">
                            <View className="flex flex-row justify-start items-center w-full gap-2">




                                <Text className="text-xl font-GoogleSansRegular">
                                    Troski
                                </Text>
                            </View>

                            <View className="w-full flex flex-row gap-2 items-center ">
                                <Text
                                    style={{paddingHorizontal: 4, paddingVertical: 1, fontSize: 10}}
                                    className=" text-white bg-black font-GoogleSansRegular rounded-full">FASTER</Text>



                            </View>
                        </View>

                        <View
                            style={{width: 84, height: 32, paddingHorizontal: 2}}
                            className="rounded-full bg-primary flex justify-center items-center">
                            <Text numberOfLines={1} className="font-GoogleSansBold text-sm">{item.price}</Text>
                        </View>
                    </Pressable>
                );
            }}
        />
    );
};

export default SelectRideType;
