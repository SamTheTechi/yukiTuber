import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  StyleSheet,
  ImageBackground,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import * as FileSystem from 'expo-file-system';
import { VideoView, useVideoPlayer } from 'expo-video';
import { countContext } from '@/app/(tabs)/_layout';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Sheet } from '@/components/BottomSheet';
import type BottomSheet from '@gorhom/bottom-sheet';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';

// Helper function to format file size
const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export default function DownloadsScreen() {
  const colorScheme = useColorScheme();
  const { count, setCount } = useContext<any>(countContext);
  const [files, setFiles] = useState<{ name: string; size: number | undefined; uri: string }[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const player = useVideoPlayer(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [imageError, setImageError] = useState(false);

  const tintColor: any = Colors[colorScheme ?? 'light'].tint;
  const backgroundColor = Colors[colorScheme ?? 'light'].background;
  const textColor = Colors[colorScheme ?? 'light'].text;

  const folderPath = FileSystem.documentDirectory + 'Downloads/';

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const fileList = await FileSystem.readDirectoryAsync(folderPath);
        const filesWithInfo = await Promise.all(
          fileList.map(async (file) => {
            const fileUri = folderPath + file;
            try {
              const info = await FileSystem.getInfoAsync(fileUri);
              return { name: file, size: undefined, uri: fileUri };
            } catch (error) {
              console.warn(`Could not get info for file: ${file}`, error);
              return { name: file, size: undefined, uri: fileUri };
            }
          })
        );
        setFiles(filesWithInfo);
      } catch (error) {
        console.warn('Error reading directory:', error);
        setFiles([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFiles();
  }, [count, folderPath]);

  const handleFileSelect = (file: string) => {
    setSelectedFile(file);
    bottomSheetRef.current?.expand();
    const fileUri = `${folderPath}${file}`;
    player.replace(fileUri);
    player.play();
  };

  const handleSheetClose = () => {
    player.pause();
    setSelectedFile(null);
  };

  const handleDelete = async (fileUri: string) => {
    try {
      await FileSystem.deleteAsync(fileUri);
      setCount((prev: number) => prev + 1);
    } catch (error) {
      console.warn('Error deleting file:', error);
    }
  };

  const handleSave = async () => {
    if (!selectedFile) return;
    const fileUri = `${folderPath}${selectedFile}`;
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        await MediaLibrary.saveToLibraryAsync(fileUri);
        alert('Video saved to gallery!');
      } else {
        alert('Permission to access media library denied!');
      }
    } catch (error) {
      console.warn('Error saving to gallery:', error);
      alert('Failed to save video to gallery.');
    }
  };

  return (
    <>
      <ParallaxScrollView
        headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
        headerHeight={200}
        headerImage={
          <ImageBackground
            style={[StyleSheet.absoluteFill, { justifyContent: 'flex-end' }]}
            imageStyle={{ resizeMode: 'cover', alignSelf: 'flex-end' }}
            source={require('@/assets/images/backdrop.jpg')}
          />
        }>
        <View style={styles.contentContainer}>
          {loading ? (
            <ActivityIndicator size="large" color={tintColor} />
          ) : (
            <>
              {files.length === 0 ? (
                <Text style={[styles.emptyText, { color: textColor }]}>No files found in the downloads folder.</Text>
              ) : (
                <View>
                  {files.map((item) => {

                    return (
                      <TouchableOpacity key={item.name} onPress={() => handleFileSelect(item.name)}>
                        <View
                          style={[
                            styles.fileItem,
                            { backgroundColor, borderColor: tintColor },
                            selectedFile === item.name && { backgroundColor: tintColor },
                          ]}
                        >
                          <Image
                            source={
                              !imageError
                                ? { uri: item.uri }
                                : require('@/assets/images/image.png')
                            }
                            onError={() => setImageError(true)}
                            style={styles.thumbnail}
                            contentFit="cover"
                          />
                          <View style={{ flex: 1, marginLeft: 10 }}>
                            <ThemedText style={{ color: textColor }} numberOfLines={1} ellipsizeMode="tail">
                              {item.name}
                            </ThemedText>
                            <ThemedText style={{ color: textColor, fontSize: 12 }}>
                              {item.size ? formatBytes(item.size) : 'Size not available'}
                            </ThemedText>
                          </View>
                          <TouchableOpacity onPress={() => handleDelete(item.uri)} style={{ padding: 10 }}>
                            <MaterialIcons name="delete" size={24} color={textColor} />
                          </TouchableOpacity>
                        </View>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              )}
            </>
          )}
        </View>
      </ParallaxScrollView>

      <Sheet bottomSheetRef={bottomSheetRef} snapPoints='48' onClose={handleSheetClose}>

        <TouchableOpacity style={{ marginBottom: 16 }} onPress={() => bottomSheetRef.current?.close()}>
          <Text style={{ color: tintColor, fontWeight: 'bold', fontSize: 20 }}>Close</Text>
        </TouchableOpacity>

        <VideoView style={styles.video} player={player} allowsFullscreen />

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: tintColor }]}
          onPress={handleSave}>
          <Text style={[styles.saveButtonText, { color: backgroundColor }]}>Save to Gallery</Text>
        </TouchableOpacity>

      </Sheet>

    </>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  fileItem: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  video: {
    width: '95%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    marginBottom: 16,
  },
  thumbnail: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },

  saveButton: {
    width: '80%',
    paddingVertical: 15,
    marginTop: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
