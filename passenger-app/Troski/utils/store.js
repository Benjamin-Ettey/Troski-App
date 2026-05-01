import {create} from "zustand"

export const useAppStore = create((set)=> ({

        name: '',
        email: '',
        number: '',

        setName: (name) => set({ name }),
        setEmail: (email) => set({ email }),
        setNumber: (number) => set({ number }),

        clearUser: () => set({ name: '', email: '' , number: '',}),

}));