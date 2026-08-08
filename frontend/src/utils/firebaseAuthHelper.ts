// Web stub helper - react-native-firebase is native-only
export const getAuth = () => {
  return {};
};

export const signInWithPhoneNumber = async (authInstance: any, phone: string): Promise<any> => {
  throw new Error("SMS not supported on Web. Please test on native device.");
};
