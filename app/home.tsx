"use client";

import React, { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { matchService } from "./services/matchService";
import { walletService } from "./services/walletService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bell, Clock, Crown, Eye, Gamepad2, Home, IndianRupee, Share2, Target,
  Timer, Trophy, Users, Wallet, LogOut, Settings,
} from "lucide-react";

// -------- Screen Router Type --------
export type Screen =
  | "login"
  | "home"
  | "squad"
  | "wallet"
  | "matches"
  | "leaderboard"
  | "live"
  | "settings"
  | "profile";

// -------- Types (mirror your schema) --------
type MapName = "Erangel" | "Sanhok" | "Miramar" | "Vikendi";
type MatchStatus = "upcoming" | "live" | "completed" | "cancelled";

type PrizeDistribution = {
  rankRewards: {
    total: number;
    ranks: {
      rank: "1st Place" | "2nd Place" | "3rd Place" | "4th Place" | "5th Place";
      amount: number;
    }[];
  };
  killRewards: { total: number; perKill: number; maxKills: number };
  customRewards: { name: string; amount: number }[];
  summary: {
    totalDistributed: number;
    rankRewardsTotal: number;
    killRewardsTotal: number;
    customRewardsTotal: number;
  };
};

type MatchDoc = {
  _id: string;
  name: string;
  entryFee: number;
  prizePool: number;
  maxPlayers: number;
  map: MapName;
  startTime: string; // ISO
  prizeDistribution: PrizeDistribution;
  status: MatchStatus;
  createdAt: string;
  updatedAt: string;
  // FE-only until backend provides:
  playersJoined?: number;
  image?: string;
};

type UserStats = {
  totalMatches: number;
  matchesWon: number;
  totalKills: number;
  rank: number;
  walletBalance: number;
};

// -------- Helpers --------
async function listMatches(): Promise<MatchDoc[]> {
  const response = await matchService.getAllMatches();
  return (response?.data ?? response) as MatchDoc[];
}

async function getUserStats(): Promise<UserStats> {
  try {
    const userStr = localStorage.getItem("user");
    if (!userStr) throw new Error("No user found");

    const user = JSON.parse(userStr);

    // Get wallet balance
    let walletBalance = 0;
    try {
      const walletResponse = await walletService.getBalance(user._id);
      if (walletResponse?.success) {
        walletBalance = walletResponse.data.balance || 0;
      }
    } catch (walletError) {
      console.log("Wallet not found, using default balance");
    }

    return {
      totalMatches: 0,
      matchesWon: 0,
      totalKills: 0,
      rank: 0,
      walletBalance: walletBalance
    };
  } catch (error) {
    console.error("Failed to load user stats:", error);
    return {
      totalMatches: 0,
      matchesWon: 0,
      totalKills: 0,
      rank: 0,
      walletBalance: 0
    };
  }
}

const timeLeft = (iso: string) => {
  const ms = new Date(iso).getTime() - Date.now();
  if (Number.isNaN(ms)) return "-";
  if (ms <= 0) return "Starting…";
  const m = Math.floor(ms / 60000);
  const h = Math.floor(m / 60);
  return h > 0 ? `${h}h ${m % 60}m` : `${m} min`;
};

// -------- Component --------
export default function HomeScreen({
  currentScreen,
  setCurrentScreen,
  walletBalance,
  setIsLoggedIn,
}: {
  currentScreen: Screen;
  setCurrentScreen: Dispatch<SetStateAction<Screen>>;
  walletBalance: number;
  setIsLoggedIn: Dispatch<SetStateAction<boolean>>;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchDoc[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    totalMatches: 0,
    matchesWon: 0,
    totalKills: 0,
    rank: 0,
    walletBalance: 0
  });
  const [liveMatchesCount, setLiveMatchesCount] = useState(0);

  //useEffect hook to load matches and user stats
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);

        // Load matches and user stats in parallel
        const [matchesData, statsData] = await Promise.all([
          listMatches(),
          getUserStats()
        ]);

        if (!alive) return;

        // Process matches data
        const withDerived = matchesData.map((m, i) => ({
          ...m,
          image: m.image || `/placeholder.svg?height=80&width=80&text=${encodeURIComponent(m.map)}`,
          playersJoined: m.playersJoined ?? 0, // Remove hardcoded calculation
        }));

        setMatches(withDerived);
        setUserStats(statsData);

        // Count live matches
        const liveCount = matchesData.filter(m => m.status === "live").length;
        setLiveMatchesCount(liveCount);

        setError(null);
      } catch (e: any) {
        setError(e?.response?.data?.error || e?.message || "Failed to load data");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const upcoming = useMemo(() => matches.filter((m) => m.status === "upcoming"), [matches]);
  const live = useMemo(() => matches.filter((m) => m.status === "live"), [matches]);

  const handleLogout = () => {
    try { localStorage.removeItem("user") } catch { }
    setIsLoggedIn(false);
    setCurrentScreen("login");
  };

  const joinMatch = async (matchId: string, entryFee: number, matchName: string) => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        alert("Please login to join matches");
        return;
      }

      const user = JSON.parse(userStr);

      // Call the join match endpoint
      // The backend handles wallet deduction and registration atomically
      const response = await matchService.joinMatch(matchId, { userId: user._id });

      if (response?.success) {
        alert(`Successfully joined ${matchName}! Entry fee of ₹${entryFee} deducted from wallet.`);

        // Refresh data
        const [matchesData, statsData] = await Promise.all([
          listMatches(),
          getUserStats()
        ]);

        const withDerived = matchesData.map((m, i) => ({
          ...m,
          image: m.image || `/placeholder.svg?height=80&width=80&text=${encodeURIComponent(m.map)}`,
          playersJoined: m.playersJoined ?? 0,
        }));

        setMatches(withDerived);
        setUserStats(statsData);
      } else {
        alert(response?.error || "Failed to join match");
      }
    } catch (error: any) {
      console.error("Error joining match:", error);
      // Handle specific error cases if needed
      if (error.response?.data?.required && error.response?.data?.available) {
        alert(`Insufficient balance. Required: ₹${error.response.data.required}, Available: ₹${error.response.data.available}`);
        setCurrentScreen("wallet");
      } else {
        alert(error.response?.data?.error || "Failed to join match");
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 bg-black/95 backdrop-blur-sm border-b border-green-500/20 p-4 z-50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-green-400 flex items-center">
              <Target className="w-6 h-6 mr-2" />
              Battle Lobby
            </h1>
            <p className="text-sm text-gray-400">Ready for combat, soldier?</p>
          </div>
          <div className="flex items-center space-x-3">
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 px-3 py-1">
              <IndianRupee className="w-3 h-3 mr-1" />
              {userStats.walletBalance.toLocaleString()}
            </Badge>
            <Button size="sm" variant="ghost" onClick={() => setCurrentScreen("wallet")}>
              <Wallet className="w-5 h-5 text-green-400" />
            </Button>
            <Button size="sm" variant="ghost">
              <Bell className="w-5 h-5 text-gray-400" />
            </Button>
            <Button size="sm" variant="ghost" onClick={handleLogout} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-140px)]">
        <div className="p-4 space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/30">
              <CardContent className="p-4 text-center">
                <Trophy className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
                <p className="text-lg font-bold text-white">{userStats.matchesWon}</p>
                <p className="text-xs text-gray-400">Wins</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/30">
              <CardContent className="p-4 text-center">
                <Target className="w-6 h-6 mx-auto mb-2 text-red-400" />
                <p className="text-lg font-bold text-white">{userStats.totalKills}</p>
                <p className="text-xs text-gray-400">Kills</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/30">
              <CardContent className="p-4 text-center">
                <Crown className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                <p className="text-lg font-bold text-white">
                  {userStats.rank > 0 ? `#${userStats.rank}` : 'Unranked'}
                </p>
                <p className="text-xs text-gray-400">Rank</p>
              </CardContent>
            </Card>
          </div>

          {/* Live Matches Banner - Only show if there are live matches */}
          {liveMatchesCount > 0 && (
            <Card className="bg-gradient-to-r from-red-500/20 to-red-600/10 border-red-500/30 animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
                    <div>
                      <p className="font-semibold text-red-400">{liveMatchesCount} LIVE MATCH{liveMatchesCount > 1 ? 'ES' : ''}</p>
                      <p className="text-sm text-gray-300">Watch now and learn from pros</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="bg-red-500 hover:bg-red-600 text-white"
                    onClick={() => setCurrentScreen("live")}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Watch
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loading / Error */}
          {loading && (
            <Card className="bg-gray-900 border-green-500/20">
              <CardContent className="p-4 text-center text-gray-400">Loading matches…</CardContent>
            </Card>
          )}
          {error && (
            <Card className="bg-gray-900 border-red-500/30">
              <CardContent className="p-4 text-center text-red-400">{error}</CardContent>
            </Card>
          )}

          {/* Upcoming Matches */}
          {!loading && !error && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-green-400">Upcoming Matches</h2>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  {upcoming.length} Available
                </Badge>
              </div>

              {upcoming.length === 0 ? (
                <Card className="bg-gray-900/80 border-green-500/20">
                  <CardContent className="p-4 text-center">
                    <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                    <p className="text-gray-400">No upcoming matches</p>
                    <p className="text-sm text-gray-500">Check back later for new tournaments</p>
                  </CardContent>
                </Card>
              ) : (
                upcoming.map((match) => (
                  <Card
                    key={match._id}
                    className="bg-gray-900/80 backdrop-blur-sm border-green-500/20 shadow-lg shadow-green-500/5 hover:shadow-green-500/20 transition-all duration-300 hover:border-green-500/40"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        <div className="relative">
                          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                            <Target className="w-10 h-10 text-black" />
                          </div>
                          <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1">
                            <Timer className="w-3 h-3 mr-1" />
                            {timeLeft(match.startTime)}
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
                            <div className="flex items-center text-gray-300">
                              <Users className="w-4 h-4 mr-1" />
                              {(match.playersJoined ?? 0)}/{match.maxPlayers} Players
                            </div>
                            <div className="flex items-center text-blue-400">
                              <Clock className="w-4 h-4 mr-1" />
                              {new Date(match.startTime).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full bg-gray-800 rounded-full h-2 mb-4">
                            <div
                              className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.max(
                                  0,
                                  Math.min(
                                    100,
                                    Math.round((((match.playersJoined ?? 0) / match.maxPlayers) * 100) || 0)
                                  )
                                )}%`,
                              }}
                            />
                          </div>

                          <div className="flex space-x-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-black font-semibold shadow-lg shadow-green-500/30">
                                  Join Battle
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="bg-gray-900 border-green-500/30 text-white">
                                <DialogHeader>
                                  <DialogTitle className="text-green-400">Join {match.name}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="text-center p-4 bg-gray-800 rounded-lg">
                                    <p className="text-lg font-bold text-green-400">Entry Fee: ₹{match.entryFee}</p>
                                    <p className="text-sm text-gray-400">Will be deducted from wallet</p>
                                  </div>
                                  <div className="flex space-x-2">
                                    <Button
                                      className="flex-1 bg-green-500 hover:bg-green-600 text-black"
                                      onClick={() => joinMatch(match._id, match.entryFee, match.name)}
                                    >
                                      Join Solo
                                    </Button>
                                    <Button
                                      variant="outline"
                                      className="flex-1 border-green-500/50 text-green-400 bg-transparent"
                                      onClick={() => setCurrentScreen("squad")}
                                    >
                                      Join with Squad
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>

                            <Button
                              size="sm"
                              variant="outline"
                              className="border-green-500/50 text-green-400 bg-transparent hover:bg-green-500/10"
                            >
                              <Users className="w-4 h-4" />
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
                ))
              )}
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
            { icon: Settings, label: "Settings", screen: "settings" as const },
          ].map((item) => (
            <Button
              key={item.screen}
              variant="ghost"
              size="sm"
              className={`flex flex-col items-center space-y-1 h-auto py-2 px-3 transition-all duration-200 ${currentScreen === item.screen
                ? "text-green-400 bg-green-500/10 shadow-lg shadow-green-500/20"
                : "text-gray-400 hover:text-green-400"
                }`}
              onClick={() => setCurrentScreen(item.screen)}
            >
              <item.icon className={`w-5 h-5 ${currentScreen === item.screen ? "animate-pulse" : ""}`} />
              <span className="text-xs font-medium">{item.label}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
