import { Text, TextStyle, Platform } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

type Props = {
  style?: TextStyle | TextStyle[];
  children: React.ReactNode;
  colors?: string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
};

export function GradientText({
  style,
  children,
  colors = ['#FFFFFF', '#FFD700', '#C9A84C'],
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
}: Props) {
  // Web doesn't support MaskedView — fall back to bright gold text
  if (Platform.OS === 'web') {
    return <Text style={[style, { color: '#FFD700' }]}>{children}</Text>;
  }

  return (
    <MaskedView
      maskElement={
        <Text style={[style, { backgroundColor: 'transparent' }]}>{children}</Text>
      }
    >
      <LinearGradient colors={colors as [string, string, ...string[]]} start={start} end={end}>
        <Text style={[style, { opacity: 0 }]}>{children}</Text>
      </LinearGradient>
    </MaskedView>
  );
}
