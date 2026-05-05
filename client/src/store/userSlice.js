import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    currentUser: null,
    isAuthenticated: false,
    credits: 0,
    token: null,
};

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setUserLogin: (state, action) => {
            state.currentUser = action.payload.user;
            state.isAuthenticated = true;
            state.credits = action.payload.credits || 0;
            state.token = action.payload.token;
        },
        updateCredits: (state, action) => {
            state.credits = action.payload;
        },
        setLogout: (state) => {
            state.currentUser = null;
            state.isAuthenticated = false;
            state.credits = 0;
            state.token = null;
        }
    }
});

export const { setUserLogin, updateCredits, setLogout } = userSlice.actions;
export default userSlice.reducer;
