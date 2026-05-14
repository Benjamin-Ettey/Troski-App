import { View, Text, Pressable, Image } from "react-native";
import React, { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import * as Location from "expo-location";
import { useAppStore } from "@/utils/store";
import { router } from "expo-router";

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
    return (
        <Pressable
            onPress={onPress}
            style={{
                height: 72,
                borderRadius: 24,
                marginBottom: 12,
                paddingLeft: 20,
                paddingRight: 20,
                gap: 24,
            }}
            className="w-full bg-tertiaryWhite flex flex-row justify-between items-center"
        >
            <View>
                <Image
                    source={require("../../assets/images/minibus.png")}
                    style={{ width: 32, height: 32 }}
                />
            </View>

            <View
                style={{ width: "50%", gap: 2 }}
                className="flex flex-col justify-center items-center "
            >
                <View className="flex flex-row justify-start items-center w-full gap-2">
                    <Text
                        numberOfLines={1}
                        ellipsizeMode="tail"
                        className="text-xl font-GoogleSansRegular"
                        style={{ maxWidth: "45%" }}
                    >
                        {item.pickup}
                    </Text>

                    <Ionicons name="arrow-forward" size={12} color="black" />

                    <Text
                        numberOfLines={1}
                        ellipsizeMode="tail"
                        className="text-xl font-GoogleSansRegular"
                        style={{ maxWidth: "45%" }}
                    >
                        {item.destination}
                    </Text>
                </View>

                <View className="w-full flex flex-row gap-2 items-center mt-1">
                    <Text
                        style={{ paddingHorizontal: 6, paddingVertical: 2, fontSize: 10 }}
                        className="text-white bg-black font-GoogleSansRegular rounded-full"
                    >
                        {item.minutes}
                    </Text>

                    <View style={{ gap: 2 }} className="flex flex-row items-center ml-2">
                        <Ionicons name="person" size={10} color="gray" />
                        <Text className="font-GoogleSansRegular" style={{ fontSize: 12 }}>
                            {item.passengercount}
                        </Text>
                    </View>
                </View>
            </View>

            <View
                style={{ width: 84, height: 32, paddingHorizontal: 2 }}
                className="rounded-full bg-primary flex justify-center items-center"
            >
                <Text numberOfLines={1} className="font-GoogleSansBold text-sm text-secondaryBlack">
                    {item.price}
                </Text>
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
                <View style={{ marginTop: 6, paddingHorizontal: 8, marginBottom: 12 }}>
                    <Text style={{ fontSize: 20, fontWeight: "600" }} className="font-GoogleSansMedium">
                        Rolling Trips
                    </Text>
                </View>
            }
        />
    );
};

export default RollingTrips;