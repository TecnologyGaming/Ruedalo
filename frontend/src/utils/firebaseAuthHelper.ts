// Web stub helper - react-native-firebase is native-only
export const getAuth = () => {
  return {};
};

export const verifyPhoneNumber = (auth: any, phone: string): any => {
  return {
    on: (event: string, callback: (snapshot: any) => void, errorCallback?: (error: any) => void) => {
      // Simulate error state on web since SMS is only supported in native APK
      setTimeout(() => {
        if (errorCallback) {
          errorCallback(new Error("verifyPhoneNumber is only supported on native devices (Android/iOS)."));
        } else {
          callback({
            state: "error",
            error: { message: "verifyPhoneNumber is only supported on native devices (Android/iOS)." }
          });
        }
      }, 500);
      return () => {};
    }
  };
};

export const PhoneAuthProvider = {
  credential: (verificationId: string, code: string) => {
    return { providerId: "phone", verificationId, code };
  }
};

export const signInWithCredential = async (authInstance: any, credential: any): Promise<any> => {
  throw new Error("signInWithCredential not supported on Web. Please test on native device.");
};
