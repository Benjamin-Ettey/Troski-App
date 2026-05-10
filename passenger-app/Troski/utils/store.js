import {create} from "zustand"
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const useAppStore = create(
    persist(
        (set)=> ({

        name: '',
        email: '',
        number: '',
        image: '',
        serviceprovider: '',
        pin: '',
        tempPin: '',


        setName: (name) => set({ name }),
        setEmail: (email) => set({ email }),
        setNumber: (number) => set({ number }),
        setImage: (image) => set({ image }),
        setServiceProvider: (serviceprovider)=> set({serviceprovider}),
        setPin: (pin) => set({pin}),
        setTempPin: (tempPin)=> set({tempPin}),

        removePaymentMethod: (index) =>
            set((state) => ({
                paymentMethods: state.paymentMethods.filter((_, i) => i !== index),
        })),

        paymentMethods: [],
        addPaymentMethod: (method) =>
            set((state) => ({
                paymentMethods: [...state.paymentMethods, method],
            })),


        otpEndTime: null,

            setOtpEndTime: (time) => set({ otpEndTime: time }),
            clearOtpEndTime: () => set({ otpEndTime: null }),

            clearUser: () => set({ name: '', email: '' , number: '',}),


            notifications: {
                rideUpdates: true,
                paymentNotifications: true,
                announcements: false,
            },

            toggleNotification: (key) =>
                set((state) => ({
                    notifications: {
                        ...state.notifications,
                        [key]: !state.notifications[key],
                    },
                })),


        resetNotifications: () =>
            set({
                notifications: {
                    rideUpdates: true,
                    paymentNotifications: true,
                    announcements: false,
                },
            }),


        deleteAccount: ()=> set({
            name: '',
            email: '',
            number: '',
            image: '',
            serviceprovider: '',
            pin: '',
            tempPin: '',
            rideUpdates: true,
            paymentNotifications: true,
            announcements: false,
            removePaymentMethod: (index) =>
                set((state) => ({
                    paymentMethods: state.paymentMethods.filter((_, i) => i !== index),
                })),

        }),


        pickup: null,
        destination: null,

        setPickup: (pickup) => set({ pickup }),
        setDestination: (destination) => set({ destination }),

        clearRide: () =>
            set({
                pickup: null,
                destination: null,
            }),

            pickupPoint: "",
            pickupCoords: null,

            destinationPoint: "",
            destinationCoords: null,

            setPickupPoint: (pickupPoint) => set({ pickupPoint }),
            setPickupCoords: (pickupCoords) => set({ pickupCoords }),

            setDestinationPoint: (destinationPoint) => set({ destinationPoint }),
            setDestinationCoords: (destinationCoords) => set({ destinationCoords }),


    }),


    {
            name: "app-storage",
            storage: createJSONStorage(() => AsyncStorage),
        }


    ));

