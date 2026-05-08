import {create} from "zustand"

export const useAppStore = create((set)=> ({

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


        }));

