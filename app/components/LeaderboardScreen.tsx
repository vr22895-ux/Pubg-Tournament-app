"use client";

import React, { useState, useEffect } from 'react';
// import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native'; // Removed unused RN import
import { statsService, LeaderboardEntry } from '../services/statsService';
import { Trophy, Crosshair, DollarSign, Crown, Medal, User, Home, Users, Gamepad2, Wallet, Settings } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Screen } from '../LoginScreen';

interface Props {
    onNavigate?: (screen: Screen) => void;
}

export default function LeaderboardScreen({ onNavigate }: Props) {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'kills' | 'wins' | 'money'>('kills');

    const fetchLeaderboard = async (type: 'kills' | 'wins' | 'money') => {
        setLoading(true);
        try {
            const response = await statsService.getLeaderboard(type);
            if (response.success) {
                setLeaderboard(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch leaderboard", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaderboard(activeTab);
    }, [activeTab]);

    const getRankIcon = (index: number) => {
        switch (index) {
            case 0: return <Crown className="w-6 h-6 text-yellow-400 fill-yellow-400/20" />;
            case 1: return <Medal className="w-6 h-6 text-gray-300 fill-gray-300/20" />;
            case 2: return <Medal className="w-6 h-6 text-amber-600 fill-amber-600/20" />;
            default: return <span className="text-gray-500 font-bold w-6 text-center">{index + 1}</span>;
        }
    };

    const getTabIcon = (type: string) => {
        switch (type) {
            case 'kills': return <Crosshair className="w-4 h-4 mr-2" />;
            case 'wins': return <Trophy className="w-4 h-4 mr-2" />;
            case 'money': return <DollarSign className="w-4 h-4 mr-2" />;
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-black text-white pb-20">
            <div className="p-6 pt-12 bg-gradient-to-b from-purple-900/20 to-black">
                <h1 className="text-3xl font-bold text-center mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                    Leaderboard
                </h1>
                <p className="text-gray-400 text-center text-sm mb-6">
                    Top players from all tournaments
                </p>

                <Tabs defaultValue="kills" className="w-full" onValueChange={(val) => setActiveTab(val as any)}>
                    <TabsList className="grid w-full grid-cols-3 bg-gray-900/50 border border-gray-800">
                        <TabsTrigger value="kills" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400">
                            <Crosshair className="w-4 h-4 mr-2" />
                            Killers
                        </TabsTrigger>
                        <TabsTrigger value="wins" className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400">
                            <Trophy className="w-4 h-4 mr-2" />
                            Winners
                        </TabsTrigger>
                        <TabsTrigger value="money" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">
                            <DollarSign className="w-4 h-4 mr-2" />
                            Rich List
                        </TabsTrigger>
                    </TabsList>

                    <div className="mt-6 space-y-3">
                        {loading ? (
                            <div className="text-center py-10 text-gray-500">Loading rankings...</div>
                        ) : leaderboard.length === 0 ? (
                            <div className="text-center py-10 text-gray-500">No data available yet</div>
                        ) : (
                            leaderboard.map((entry, index) => (
                                <div
                                    key={entry._id}
                                    className={cn(
                                        "flex items-center p-4 rounded-xl border border-gray-800 bg-gray-900/40 backdrop-blur-sm transition-all hover:bg-gray-800/60",
                                        index === 0 && "border-yellow-500/30 bg-yellow-500/5",
                                        index === 1 && "border-gray-500/30 bg-gray-500/5",
                                        index === 2 && "border-amber-600/30 bg-amber-600/5"
                                    )}
                                >
                                    <div className="flex-shrink-0 mr-4 flex items-center justify-center w-8">
                                        {getRankIcon(index)}
                                    </div>

                                    <div className="flex-1">
                                        <h3 className={cn(
                                            "font-bold text-lg",
                                            index === 0 ? "text-yellow-400" : "text-white"
                                        )}>
                                            {entry.playerName}
                                        </h3>
                                        <div className="flex items-center text-xs text-gray-500 mt-0.5">
                                            <span className="mr-3">{entry.matchesPlayed} Matches</span>
                                            {activeTab !== 'wins' && <span>{entry.totalWins} Wins</span>}
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className={cn(
                                            "font-bold text-xl",
                                            activeTab === 'kills' && "text-red-400",
                                            activeTab === 'wins' && "text-yellow-400",
                                            activeTab === 'money' && "text-green-400"
                                        )}>
                                            {activeTab === 'kills' && entry.totalKills}
                                            {activeTab === 'wins' && entry.totalWins}
                                            {activeTab === 'money' && `₹${entry.totalPrize}`}
                                        </div>
                                        <div className="text-xs text-gray-500 uppercase tracking-wider">
                                            {activeTab === 'kills' ? 'Kills' : activeTab === 'wins' ? 'Wins' : 'Won'}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Tabs>
            </div>

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-sm border-t border-green-500/20 z-50">
                <div className="flex items-center justify-around py-2">
                    {[
                        { icon: Home, label: "Home", screen: "home" as const },
                        { icon: Users, label: "Squad", screen: "squad" as const },
                        { icon: Gamepad2, label: "Matches", screen: "matches" as const },
                        { icon: Trophy, label: "Leaderboard", screen: "leaderboard" as const },
                        { icon: Wallet, label: "Wallet", screen: "wallet" as const },
                        { icon: Settings, label: "Settings", screen: "settings" as const },
                    ].map((item) => (
                        <Button
                            key={item.screen}
                            variant="ghost"
                            size="sm"
                            className={`flex flex-col items-center space-y-1 h-auto py-2 px-3 transition-all duration-200 ${item.screen === "leaderboard"
                                ? "text-green-400 bg-green-500/10 shadow-lg shadow-green-500/20"
                                : "text-gray-400 hover:text-green-400"
                                }`}
                            onClick={() => onNavigate?.(item.screen)}
                        >
                            <item.icon className={`w-5 h-5 ${item.screen === "leaderboard" ? "animate-pulse" : ""}`} />
                            <span className="text-xs font-medium">{item.label}</span>
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    );
}
