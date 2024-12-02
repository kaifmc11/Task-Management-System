import { configureStore } from '@reduxjs/toolkit';
import authReducer from "../redux/slices/authSlice";
import { apiSlice } from '../redux/slices/apiSlice';

const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer, 
    auth: authReducer, 
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
  devTools: true,
});

export default store;
