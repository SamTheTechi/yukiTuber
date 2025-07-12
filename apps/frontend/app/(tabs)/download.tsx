import React, { useState, useEffect, useContext } from 'react';
import {
  StyleSheet,
  ImageBackground,
  Text,
  View,
  Image,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import * as FileSystem from 'expo-file-system';
import { VideoView, useVideoPlayer } from 'expo-video';
import { countContext } from '@/app/(tabs)/_layout'
import { ThemedText } from '@/components/ThemedText';

export default function DownloadsScreen() {
  const { count } = useContext<any>(countContext);
  const [files, setFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [playing, setPlaying] = useState<boolean>(false);
  const player = useVideoPlayer(null);

  const folderPath = FileSystem.documentDirectory + 'Downloads/';

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const fileList = await FileSystem.readDirectoryAsync(folderPath);
        setFiles(fileList);
      } catch (error) {
        console.warn('Error reading directory:', error);
        setFiles([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFiles();
  }, [count]);

  const handleFileSelect = (file: string) => {
    setSelectedFile(file);
    const fileUri = `${folderPath}${file}`;
    player.replace(fileUri);
    player.play();
  };


  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerHeight={180}
      headerImage={
        <ImageBackground
          style={[StyleSheet.absoluteFill, { justifyContent: 'flex-end' }]}
          imageStyle={{ resizeMode: 'cover', alignSelf: 'flex-end' }}
          source={require('@/assets/images/backdrop.jpg')}
        />
      }>
      <View style={styles.contentContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#999" />
        ) : (
          <>
            <VideoView style={styles.video} player={player} allowsFullscreen />
            {files.length === 0 ? (
              <Text style={styles.emptyText}>No files found in the downloads folder.</Text>
            ) : (
              <View style={styles.listContainer}>
                {files.map((item) => {
                  const fileUri = folderPath + item;

                  return (
                    <Pressable key={item} onPress={() => handleFileSelect(item)}>
                      <View style={[styles.fileItem, selectedFile === item && styles.selectedFileItem]}>
                        <Image
                          source={{ uri: fileUri }}
                          style={styles.thumbnail}
                          resizeMode="cover"
                        />
                        <ThemedText style={{ color: 'black', marginLeft: 10 }}>{item}</ThemedText>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

            )}
          </>
        )}
      </View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#999',
  },
  fileItem: {
    padding: 8,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedFileItem: {
    backgroundColor: '#e0e0ff',
    borderColor: '#a0a0ff',
  },
  video: {
    width: '100%',
    height: 200,
    marginBottom: 16,
    borderRadius: 8,
  },
  thumbnail: {
    width: 40,
    height: 40,
    borderRadius: 4,
    backgroundColor: '#ccc',
  },
});
