import React, { useState, useContext, useEffect } from 'react';
import {
  StyleSheet,
  ImageBackground,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
  Text,
} from 'react-native';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { countContext } from '@/app/(tabs)/_layout'
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/colors'
import { useColorScheme } from '@/hooks/useColorScheme';
import { endpoint } from '@/constants/endpoint'
import * as Linking from 'expo-linking'
import * as FileSystem from 'expo-file-system';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState<'mp3' | 'mp4'>('mp4');
  const [quality, setQuality] = useState<'320' | '480' | '720' | '1080'>('480');
  const [isDownloading, setIsDownloading] = useState(false);
  const context = useContext(countContext);
  if (!context) throw new Error('countContext not provided');
  const { setCount } = context;

  const tintColor: any = Colors[colorScheme ?? 'light'].tint;
  const backgroundColor = Colors[colorScheme ?? 'light'].background;
  const textColor = Colors[colorScheme ?? 'light'].text;


  useEffect(() => {
    setCount(0);

    const processUrl = (url: string | null) => {
      if (!url) return;
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        setUrl(url);
      }
    };

    const handleDeepLink = ({ url }: { url: string }) => processUrl(url);

    Linking.getInitialURL().then(processUrl).catch(console.warn);

    const sub = Linking.addEventListener('url', handleDeepLink);

    return () => sub.remove();
  }, []);



  const handleDownload = async () => {

    if (!url) {
      Alert.alert('Error', 'Please enter a YouTube URL.');
      return;
    }

    setIsDownloading(true);

    try {
      const downloadUrl = endpoint + (format === 'mp4' ? '/video' : '/audio');

      const folderPath = FileSystem.documentDirectory + 'Downloads/';
      await FileSystem.makeDirectoryAsync(folderPath, { intermediates: true });

      const filename = `${new Date().getTime().toString()}.${format}`;
      const fileUri = folderPath + filename;
      const response = await fetch(downloadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, quality }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const blob = await response.blob();

      const reader = new FileReader();

      setUrl('');
      reader.onloadend = async () => {
        if (typeof reader.result === 'string') {
          const base64data = reader.result?.split(',')[1];
          if (base64data) {
            await FileSystem.writeAsStringAsync(fileUri, base64data, {
              encoding: FileSystem.EncodingType.Base64,
            });
            setCount((count) => count + 1);
            setUrl('');
            Alert.alert('Success', `File downloaded! `);
          } else {
            throw new Error('Failed to convert blob to base64.');
          }
        } else {
          throw new Error('Unexpected blob result type');
        }
        setIsDownloading(false);
      };

      reader.onerror = () => {
        setIsDownloading(false);
        Alert.alert(
          'Download Failed',
          'Something went wrong while reading the file. Please try again.'
        );
      };

      reader.readAsDataURL(blob);

    } catch (error) {
      console.log(error);
      Alert.alert(`Error ${error}`);
      setIsDownloading(false);
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerHeight={230}
      headerImage={
        <ImageBackground
          style={[StyleSheet.absoluteFill, { justifyContent: 'flex-end' }]}
          imageStyle={{ resizeMode: 'cover', alignSelf: 'flex-end' }}
          source={require('@/assets/images/backdrop.jpg')}
        />
      }>

      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">YukiTuber !</ThemedText>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Enter YouTube URL</ThemedText>
        <TextInput
          style={[styles.input, { color: textColor, borderColor: tintColor }]}
          placeholder="https://www.youtube.com..."
          placeholderTextColor="#999"
          value={url}
          onChangeText={setUrl}
        />
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Format</ThemedText>
        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={[styles.optionButton, format === 'mp4' && { backgroundColor: tintColor }]}
            onPress={() => setFormat('mp4')}>
            <Text style={[styles.optionText, format === 'mp4' && { color: backgroundColor }]}>MP4</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionButton, format === 'mp3' && { backgroundColor: tintColor }]}
            onPress={() => setFormat('mp3')}>
            <Text style={[styles.optionText, format === 'mp3' && { color: backgroundColor }]}>MP3</Text>
          </TouchableOpacity>
        </View>
      </ThemedView>

      {format === 'mp4' && (
        <ThemedView style={styles.stepContainer}>
          <ThemedText type="subtitle">Quality</ThemedText>
          <View style={styles.optionsContainer}>
            {['320', '480', '720', '1080'].map((q) => (
              <TouchableOpacity
                key={q}
                style={[styles.optionButton, quality === q && { backgroundColor: tintColor }]}
                onPress={() => setQuality(q as any)}>
                <Text style={[styles.optionText, quality === q && { color: backgroundColor }]}>{q}p</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ThemedView>
      )}

      <TouchableOpacity
        style={[styles.downloadButton, { backgroundColor: tintColor }]}
        onPress={handleDownload}
        disabled={isDownloading}>
        {isDownloading ? (
          <ActivityIndicator color={backgroundColor} />
        ) : (
          <Text style={[styles.downloadButtonText, { color: backgroundColor }]}>Download</Text>
        )}
      </TouchableOpacity>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 20,
  },

  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 16,
  },

  optionsContainer: {
    flexDirection: 'row',
    gap: 10,
  },

  optionButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#c30000',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#c30000',
  },
  downloadButton: {
    paddingVertical: 15,
    marginTop: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
