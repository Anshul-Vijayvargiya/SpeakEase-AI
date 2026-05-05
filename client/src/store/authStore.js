import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import API from '../api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: localStorage.getItem('token') || null,
      isAuthenticated: !!localStorage.getItem('token'),
      loading: false,
      error: null,

      login: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const res = await API.post('/auth/login', { email, password });
          const { token, user } = res.data;
          
          localStorage.setItem('token', token);
          set({ 
            user, 
            token, 
            isAuthenticated: true, 
            loading: false 
          });
          return { success: true };
        } catch (err) {
          const message = err.response?.data?.message || 'Login failed';
          set({ error: message, loading: false });
          return { success: false, message };
        }
      },

      signup: async (signupData) => {
        set({ loading: true, error: null });
        try {
          const res = await API.post('/auth/register', signupData);
          const { token, user } = res.data;
          
          localStorage.setItem('token', token);
          set({ 
            user, 
            token, 
            isAuthenticated: true, 
            loading: false 
          });
          return { success: true };
        } catch (err) {
          const message = err.response?.data?.message || 'Signup failed';
          set({ error: message, loading: false });
          return { success: false, message };
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false,
          error: null 
        });
      },

      checkAuth: async () => {
        const token = get().token;
        if (!token) return;

        try {
          const res = await API.get('/auth/me');
          set({ user: res.data, isAuthenticated: true });
        } catch (err) {
          get().logout();
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);

export default useAuthStore;
