import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <LinearGradient
        colors={['#0F0C29', '#24243e', '#302B63']}
        style={styles.container}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Page Not Found</Text>
          <Text style={styles.message}>This screen doesn't exist.</Text>
          <Link href="/" style={styles.link}>
            <Text style={styles.linkText}>Go to home screen!</Text>
          </Link>
        </View>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  message: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: '#B8B8B8',
    marginBottom: 30,
    textAlign: 'center',
  },
  link: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    backgroundColor: '#E8C87E',
    borderRadius: 25,
  },
  linkText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#0B0B1A',
  },
});