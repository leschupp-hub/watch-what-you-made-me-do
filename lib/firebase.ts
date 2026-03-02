import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyAwdvO2-8yyNoQq-SAlEPrfFtDHWWDzsOM",
  authDomain: "watch-what-you-made-me-do.firebaseapp.com",
  projectId: "watch-what-you-made-me-do",
  storageBucket: "watch-what-you-made-me-do.firebasestorage.app",
  messagingSenderId: "272419642101",
  appId: "1:272419642101:web:d3b4afe3bc6294ec5f43bc",
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
