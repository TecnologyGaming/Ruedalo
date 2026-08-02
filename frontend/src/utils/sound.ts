import { Platform } from "react-native";

const SOUNDS = {
  request: "https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav",      // Bell alert
  accepted: "https://assets.mixkit.co/active_storage/sfx/2019/2019-84.wav",     // Positive double chime
  completed: "https://assets.mixkit.co/active_storage/sfx/1435/1435-84.wav",    // Cheerful chime
};

export const playSound = (type: "request" | "accepted" | "completed") => {
  if (Platform.OS === "web") {
    try {
      const audio = new Audio(SOUNDS[type]);
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch (e) {
      console.log("Audio playback failed on web:", e);
    }
  } else {
    // Graceful fallback for native if expo-audio is not installed
    console.log(`[Native Sound Fallback] Playing sound: ${type}`);
  }
};
