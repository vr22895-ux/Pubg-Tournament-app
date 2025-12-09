import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ImageBackground } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Shield, Zap } from 'lucide-react-native';
import { cssInterop } from 'nativewind';

cssInterop(BlurView, {
    className: "style",
});

export default function LoginScreen() {
    return (
        <View className="flex-1 bg-black">
            <StatusBar style="light" />

            {/* Background with Gradient Overlay for depth */}
            <LinearGradient
                colors={['#000000', '#1a0505', '#0f290a']}
                className="absolute inset-0"
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {/* Main Content */}
            <View className="flex-1 justify-center px-6">

                {/* Animated Logo Section */}
                <Animated.View
                    entering={FadeInUp.delay(200).duration(1000).springify()}
                    className="items-center mb-12"
                >
                    <View className="w-24 h-24 bg-bgmi-green/20 rounded-full items-center justify-center border border-bgmi-green mb-4 shadow-lg shadow-bgmi-green/50">
                        <Shield size={48} color="#CFFF04" />
                    </View>
                    <Text className="text-4xl font-extrabold text-white tracking-wider">
                        BGMI <Text className="text-bgmi-green">ARENA</Text>
                    </Text>
                    <Text className="text-gray-400 text-sm mt-2 tracking-widest uppercase">
                        Elite Esports Platform
                    </Text>
                </Animated.View>

                {/* Glassmorphism Login Card */}
                <Animated.View
                    entering={FadeInDown.delay(400).duration(1000).springify()}
                >
                    <BlurView
                        intensity={30}
                        tint="dark"
                        className="overflow-hidden rounded-3xl border border-white/10 p-6"
                    >
                        {/* Phone Input */}
                        <View className="mb-4">
                            <Text className="text-gray-400 mb-2 font-bold ml-1">PHONE NUMBER</Text>
                            <View className="bg-black/50 border border-white/10 rounded-xl flex-row items-center h-14 px-4 focus:border-bgmi-green">
                                <Text className="text-gray-400 mr-2">+91</Text>
                                <TextInput
                                    placeholder="9876543210"
                                    placeholderTextColor="#666"
                                    keyboardType="phone-pad"
                                    className="flex-1 text-white font-bold text-lg"
                                />
                            </View>
                        </View>

                        {/* Action Button */}
                        <TouchableOpacity
                            className="w-full h-14 rounded-xl overflow-hidden mt-2"
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#CFFF04', '#A3E635']}
                                className="w-full h-full items-center justify-center flex-row"
                            >
                                <Text className="text-black font-heavy text-lg font-bold mr-2 uppercase">
                                    Enter Battle
                                </Text>
                                <Zap size={20} color="black" fill="black" />
                            </LinearGradient>
                        </TouchableOpacity>

                        <Text className="text-gray-500 text-center mt-6 text-xs">
                            By entering, you agree to the <Text className="text-bgmi-green">Terms of Combat</Text>
                        </Text>
                    </BlurView>
                </Animated.View>
            </View>
        </View>
    );
}
