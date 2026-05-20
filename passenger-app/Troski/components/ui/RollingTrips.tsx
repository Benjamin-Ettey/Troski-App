import { View, Text, Pressable, Image } from "react-native";
import React, { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import * as Location from "expo-location";
import { useAppStore } from "@/utils/store";
import { router } from "expo-router";
import {useColorScheme} from "nativewind";

type TripItem = {
    id: number;
    pickup: string;
    destination: string;
    area: string;
    minutes: string;
    price: string;
    passengercount: number;
    destinationCoords?: { latitude: number; longitude: number } | null;
};

const GHANA_BBOX = {
    minLon: -3.3,
    minLat: 4.5,
    maxLon: 1.2,
    maxLat: 11.2,
};

const TripRow = ({ item, onPress }: { item: TripItem; onPress: () => void }) => {
    const { colorScheme } = useColorScheme();

    return (
        <Pressable
            onPress={onPress}
            className="w-full h-20 rounded-3xl px-4 mb-4 gap-4 bg-tertiaryWhite dark:bg-secondaryGray/40 flex flex-col justify-center items-center"
        >
            <View className="flex w-full flex-row justify-between items-center gap-4">

                <View className="flex-row flex gap-4 flex-1">

                    <Image
                        source={require("../../assets/images/minibus.png")}
                        className="w-9 h-9 mx-2"
                    />


                    <View className="flex flex-col">

                        <View className="flex  flex-row justify-start items-center gap-2">
                            <Text
                                numberOfLines={1}
                                ellipsizeMode="tail"
                                className="text-lg leading-5 font-GoogleSansRegular max-w-[80px] text-secondaryBlack dark:text-tertiaryGray"
                            >
                                {item.pickup}
                            </Text>

                            <Ionicons name="arrow-forward" size={12} color={colorScheme === "dark"? "#f0f0f0": "#444444"} />

                            <Text
                                numberOfLines={1}
                                ellipsizeMode="tail"
                                className="text-lg leading-5 font-GoogleSansRegular max-w-[80px] text-secondaryBlack dark:text-tertiaryGray"
                            >
                                {item.destination}
                            </Text>
                        </View>

                        <View className="w-full flex flex-row items-center mt-1">
                            <Text
                                className="text-white text-xs leading-4 px-2 py-0.5 bg-secondaryBlack font-GoogleSansRegular rounded-full"
                            >
                                {item.minutes}
                            </Text>

                            <View className="flex gap-1 flex-row items-center ml-2">
                                <Ionicons name="person" size={12} color={colorScheme === "dark"? "#f0f0f0": "gray"} />
                                <Text className="font-GoogleSansRegular text-sm leading-4 text-secondaryGray dark:text-tertiaryWhite">
                                    {item.passengercount}
                                </Text>
                            </View>
                        </View>

                    </View>

                </View>


                <View
                    className="rounded-full h-9 w-24 bg-primary dark:bg-secondaryBlack flex justify-center items-center"
                >
                    <Text numberOfLines={1} className="font-GoogleSansBold text-sm leading-4 dark:text-primary text-secondaryBlack">
                        {item.price}
                    </Text>

                </View>




            </View>





        </Pressable>
    );
};

const RollingTrips = () => {
    const setPickupPoint = useAppStore((s) => s.setPickupPoint);
    const setDestinationPoint = useAppStore((s) => s.setDestinationPoint);
    const setPickupCoords = useAppStore((s) => s.setPickupCoords);
    const setDestinationCoords = useAppStore((s) => s.setDestinationCoords);
    const setTripPrice = useAppStore((s) => s.setTripPrice);

    const pickupCoords = useAppStore((s) => s.pickupCoords);
    const destinationCoords = useAppStore((s) => s.destinationCoords);

    const [data, setData] = useState<TripItem[]>([]);

    useEffect(() => {
        const fetchLocation = async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== "granted") return;

                const location = await Location.getCurrentPositionAsync({});
                const { latitude, longitude } = location.coords;

                const reverse = await Location.reverseGeocodeAsync({ latitude, longitude });
                const place = reverse[0];

                const junction =
                    place?.street || place?.district || place?.subregion || place?.city || "Current Location";

                const area = [place?.city, place?.region].filter(Boolean).join(", ");
                const fullPickup = area.length > 0 ? `${junction}, ${area}` : junction;

                setPickupPoint(fullPickup);
                setPickupCoords({ latitude, longitude });

                const destinations = [
                    { destination: "Madina Station", area: "Madina, Accra" },
                    { destination: "Circle", area: "Circle, Accra" },
                    { destination: "Kasoa Market", area: "Kasoa Road" },
                    { destination: "Kotoka Airport", area: "Airport, Accra" },
                ];

                const bbox = `${GHANA_BBOX.minLon},${GHANA_BBOX.minLat},${GHANA_BBOX.maxLon},${GHANA_BBOX.maxLat}`;

                const geocode = async (name: string) => {
                    try {
                        const res = await fetch(
                            `https://photon.komoot.io/api/?q=${encodeURIComponent(name)}&limit=1&countrycode=gh&bbox=${encodeURIComponent(
                                bbox
                            )}`
                        );
                        const json = await res.json();
                        const f = (json.features ?? [])[0];
                        if (f?.geometry?.coordinates) {
                            const [lng, lat] = f.geometry.coordinates;
                            return { latitude: lat, longitude: lng };
                        }
                    } catch {}
                    return null;
                };

                const tripsPromises = destinations.map(async (d, idx) => {
                    const coords = await geocode(d.destination);

                    return {
                        id: idx + 1,
                        pickup: fullPickup,
                        destination: d.destination,
                        area: d.area,
                        minutes: `${Math.floor(Math.random() * 15) + 5} min`,
                        price: `GH₵${(Math.random() * 20 + 5).toFixed(2)}`,
                        passengercount: Math.floor(Math.random() * 20) + 1,
                        destinationCoords: coords,
                    };
                });

                const trips = await Promise.all(tripsPromises);
                setData(trips);
            } catch (err) {
                console.log("Location error:", err);
            }
        };

        fetchLocation();
    }, []);

    const handleSelect = (item: TripItem) => {
        setPickupCoords(useAppStore.getState().pickupCoords);
        setDestinationPoint(item.destination);
        setTripPrice(item.price);

        if (item.destinationCoords) {
            setDestinationCoords(item.destinationCoords);
        } else {
            setDestinationCoords(null);
        }

        router.push("/homepage/bookings/selectRide");
    };

    return (
        <FlashList
            data={data}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
                <TripRow item={item} onPress={() => handleSelect(item)} />
            )}
            getItemType={() => "trip"}
            numColumns={1}
            showsVerticalScrollIndicator={true}
            ListHeaderComponent={
                <View>
                    <Text className="font-GoogleSansMedium text-xl leading-6 my-3 text-secondaryBlack dark:text-white">
                        Rolling Trips
                    </Text>
                </View>
            }
        />
    );
};

export default RollingTrips;