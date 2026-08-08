// Web stub - react-native-firebase is native-only
const nativeAuth = () => {
  return {
    signInWithPhoneNumber: async (phone: string) => {
      throw new Error("Native Auth not supported on Web");
    }
  };
};
export default nativeAuth;
