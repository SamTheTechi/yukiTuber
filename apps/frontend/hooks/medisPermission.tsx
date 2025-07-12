import * as ML from 'expo-media-library';

export const requestMedisPremission = async () => {
  const { status } = await ML.requestPermissionsAsync();
  return status != 'granted'
}
