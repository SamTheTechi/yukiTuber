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
import * as FileSystem from 'expo-file-system';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function HomeScreen() {
  const { setCount } = useContext<any>(countContext);
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState<'mp3' | 'mp4'>('mp4');
  const [quality, setQuality] = useState<'320' | '480' | '720' | '1080'>('720');
  const [isDownloading, setIsDownloading] = useState(false);

  const backgroundColor = useThemeColor({ light: '#fff', dark: '#151718' }, 'background');
  const textColor = useThemeColor({ light: '#11181C', dark: '#ECEDEE' }, 'text');
  const tintColor = useThemeColor({ light: '#0a7ea4', dark: '#fff' }, 'tint');

  useEffect(() => {
    setCount(0)
  }, [])

  const handleDownload = async () => {
    if (!url) {
      Alert.alert('Error', 'Please enter a YouTube URL.');
      return;
    }

    setIsDownloading(true);

    try {
      const serverBaseUrl = 'http://192.168.52.128:3000';
      const endpoint = format === 'mp4' ? '/video' : '/audio';
      const downloadUrl = serverBaseUrl + endpoint;

      const folderPath = FileSystem.documentDirectory + 'Downloads/';
      await FileSystem.makeDirectoryAsync(folderPath, { intermediates: true });

      const videoIdMatch = url.match(/(?:v=)([^&?]+)/);
      const videoId = videoIdMatch ? videoIdMatch[1] : new Date().getTime().toString();
      const filename = `${videoId}.${format}`;
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
      reader.onloadend = async () => {
        if (typeof reader.result === 'string') {
          const base64data = reader.result?.split(',')[1];
          if (base64data) {
            await FileSystem.writeAsStringAsync(fileUri, base64data, {
              encoding: FileSystem.EncodingType.Base64,
            });

            console.log('Downloaded to:', fileUri);
            Alert.alert('Success', `File downloaded to ${fileUri}`);
          } else {
            throw new Error('Failed to convert blob to base64.');
          }
        } else {
          throw new Error('Unexpected blob result type');
        }
        setIsDownloading(false);
      };

      reader.readAsDataURL(blob);

    } catch (error) {
      console.error(error);
      Alert.alert(`Error ${error}`);
      setIsDownloading(false);
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerHeight={250}
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
          placeholder="https://www.youtube.com/watch?v=..."
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
  },
  stepContainer: {
    gap: 8,
    marginBottom: 16,
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
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
