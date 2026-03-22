import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyDc5rsbsKl1c-uYySOFDRkqIqGr9LoOIMI",
    authDomain: "new-bus-treking.firebaseapp.com",
    databaseURL: "https://new-bus-treking-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "new-bus-treking",
    storageBucket: "new-bus-treking.firebasestorage.app",
    messagingSenderId: "1044937747406",
    appId: "1:1044937747406:web:da9b5237f52acc979cd99f"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
