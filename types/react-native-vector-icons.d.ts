declare module 'react-native-vector-icons/MaterialIcons' {
  import { ComponentType } from 'react';
  import { TextProps } from 'react-native';
  const MaterialIcons: ComponentType<TextProps & { name: string; size?: number; color?: string; style?: any }>;
  export default MaterialIcons;
}

declare module 'react-native-vector-icons/MaterialCommunityIcons' {
  import { ComponentType } from 'react';
  import { TextProps } from 'react-native';
  const MaterialCommunityIcons: ComponentType<TextProps & { name: string; size?: number; color?: string; style?: any }>;
  export default MaterialCommunityIcons;
}
