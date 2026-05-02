import {create} from "zustand"

export const useAppStore = create((set)=> ({

        name: '',
        email: '',
        number: '',

        setName: (name) => set({ name }),
        setEmail: (email) => set({ email }),
        setNumber: (number) => set({ number }),
        otpEndTime: null,

        setOtpEndTime: (time) => set({ otpEndTime: time }),
        clearOtpEndTime: () => set({ otpEndTime: null }),

        clearUser: () => set({ name: '', email: '' , number: '',}),

}));