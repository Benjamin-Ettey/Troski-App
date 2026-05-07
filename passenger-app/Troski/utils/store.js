import {create} from "zustand"

export const useAppStore = create((set)=> ({

        name: '',
        email: '',
        number: '',
        image: '',
        serviceprovider: '',


        setName: (name) => set({ name }),
        setEmail: (email) => set({ email }),
        setNumber: (number) => set({ number }),
        setImage: (image) => set({ image }),
        setServiceProvider: (serviceprovider)=> set({serviceprovider}),

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

        }));