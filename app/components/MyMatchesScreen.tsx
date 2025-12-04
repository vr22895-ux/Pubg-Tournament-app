"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Bell, Clock, Crown, Eye, Gamepad2, Home, IndianRupee, Share2, Target,
    Timer, Trophy, Users, Wallet, LogOut, CheckCircle,
} from "lucide-react";

// -------- API base --------
const API_BASE = "http://localhost:5050/api";

// -------- Types --------
type MapName = "Erangel" | "Sanhok" | "Miramar" | "Vikendi";
type MatchStatus = "upcoming" | "live" | "completed" | "cancelled";

type MatchDoc = {
    _id: string;
    name: string;
    entryFee: number;
    prizePool: number;
    maxPlayers: number;
    map: MapName;
    startTime: string; // ISO
    status: MatchStatus;
    playersJoined?: number;
    image?: string;
    registeredPlayers?: any[];
};

// -------- Helper --------
const timeLeft = (iso: string) => {
    const ms = new Date(iso).getTime() - Date.now();
    if (Number.isNaN(ms)) return "-";
    if (ms <= 0) return "Starting…";
    const m = Math.floor(ms / 60000);
    const h = Math.floor(m / 60);
    return h > 0 ? `${h}h ${m % 60}m` : `${m} min`;
};

export default function MyMatchesScreen({
    onLogout,
    onNavigate,
}: {
    onLogout: () => void;
    onNavigate: (screen: "home" | "squad" | "wallet" | "matches" | "leaderboard" | "live" | "settings") => void;
}) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [myMatches, setMyMatches] = useState<MatchDoc[]>([]);

    // Function to load my matches
    async function listMyMatches() {
        const token = localStorage.getItem("token");
        if (!token) return [];

        try {
            const res = await axios.get(`${API_BASE}/matches/my-matches`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.data.data;
        } catch (err) {
            console.error("Failed to load my matches", err);
            throw err;
        }
    }

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                setLoading(true);
                const data = await listMyMatches();

                if (!alive) return;

                const withDerived = data.map((m: any) => ({
                    ...m,
                    image: m.image || `/placeholder.svg?height=80&width=80&text=${encodeURIComponent(m.map)}`,
                    playersJoined: m.registeredPlayers ? m.registeredPlayers.length : 0,
                }));

                setMyMatches(withDerived);
                setError(null);
            } catch (e: any) {
                setError(e?.response?.data?.error || e?.message || "Failed to load matches");
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, []);

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Header */}
            <div className="sticky top-0 bg-black/95 backdrop-blur-sm border-b border-green-500/20 p-4 z-50">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-green-400 flex items-center">
                            <Gamepad2 className="w-6 h-6 mr-2" />
                            My Matches
                        </h1>
                        <p className="text-sm text-gray-400">Your battle history</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={onLogout} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                        <LogOut className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            <ScrollArea className="h-[calc(100vh-140px)]">
                <div className="p-4 space-y-6">
                    {loading && (
                        <Card className="bg-gray-900 border-green-500/20">
                            <CardContent className="p-4 text-center text-gray-400">Loading your matches...</CardContent>
                        </Card>
                    )}

                    {error && (
                        <Card className="bg-gray-900 border-red-500/30">
                            <CardContent className="p-4 text-center text-red-400">{error}</CardContent>
                        </Card>
                    )}

                    {!loading && !error && myMatches.length === 0 && (
                        <Card className="bg-gray-900/80 border-green-500/20">
                            <CardContent className="p-8 text-center">
                                <Gamepad2 className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                                <h3 className="text-xl font-bold text-white mb-2">No Matches Found</h3>
                                <p className="text-gray-400 mb-6">You haven't joined any matches yet.</p>
                                <Button
                                    className="bg-green-500 hover:bg-green-600 text-black font-bold"
                                    onClick={() => onNavigate("home")}
                                >
                                    Browse Upcoming Matches
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {!loading && !error && myMatches.length > 0 && (
                        <div className="space-y-4">
                            {myMatches.map((match) => (
                                <Card
                                    key={match._id}
                                    className="bg-gray-900/80 backdrop-blur-sm border-green-500/20 shadow-lg shadow-green-500/5 hover:shadow-green-500/20 transition-all duration-300"
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-start space-x-4">
                                            <div className="relative">
                                                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                                                    <Target className="w-10 h-10 text-black" />
                                                </div>
                                                <Badge className={`absolute -top-2 -right-2 text-white text-xs px-2 py-1 ${match.status === 'live' ? 'bg-red-500 animate-pulse' :
                                                        match.status === 'completed' ? 'bg-blue-500' :
                                                            match.status === 'cancelled' ? 'bg-gray-500' : 'bg-green-500'
                                                    }`}>
                                                    {match.status === 'upcoming' ? (
                                                        <span className="flex items-center"><Timer className="w-3 h-3 mr-1" />{timeLeft(match.startTime)}</span>
                                                    ) : match.status}
                                                </Badge>
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h3 className="font-bold text-green-400 text-lg">{match.name}</h3>
                                                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">{match.map}</Badge>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                                                    <div className="flex items-center text-gray-300">
                                                        <IndianRupee className="w-4 h-4 mr-1 text-yellow-400" />
                                                        Entry: ₹{match.entryFee}
                                                    </div>
                                                    <div className="flex items-center text-green-400">
                                                        <Trophy className="w-4 h-4 mr-1" />
                                                        Prize: ₹{match.prizePool.toLocaleString()}
                                                    </div>
                                                    <div className="flex items-center text-blue-400 col-span-2">
                                                        <Clock className="w-4 h-4 mr-1" />
                                                        {new Date(match.startTime).toLocaleString()}
                                                    </div>
                                                </div>

                                                <div className="flex space-x-2">
                                                    <Button className="flex-1 bg-gray-800 text-gray-300 cursor-default hover:bg-gray-800 border border-gray-700">
                                                        <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                                                        Registered
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-green-500/50 text-green-400 bg-transparent hover:bg-green-500/10"
                                                    >
                                                        <Share2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-sm border-t border-green-500/20 z-50">
                <div className="flex items-center justify-around py-2">
                    {[
                        { icon: Home, label: "Home", screen: "home" as const },
                        { icon: Users, label: "Squad", screen: "squad" as const },
                        { icon: Gamepad2, label: "Matches", screen: "matches" as const },
                        { icon: Trophy, label: "Leaderboard", screen: "leaderboard" as const },
                        { icon: Wallet, label: "Wallet", screen: "wallet" as const },
                    ].map((item) => (
                        <Button
                            key={item.screen}
                            variant="ghost"
                            size="sm"
                            className={`flex flex-col items-center space-y-1 h-auto py-2 px-3 transition-all duration-200 ${item.screen === "matches"
                                    ? "text-green-400 bg-green-500/10 shadow-lg shadow-green-500/20"
                                    : "text-gray-400 hover:text-green-400"
                                }`}
                            onClick={() => onNavigate(item.screen)}
                        >
                            <item.icon className={`w-5 h-5 ${item.screen === "matches" ? "animate-pulse" : ""}`} />
                            <span className="text-xs font-medium">{item.label}</span>
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    );
}
