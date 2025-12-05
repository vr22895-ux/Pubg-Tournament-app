"use client";

import React, { useState, useEffect } from "react";
import { matchService } from "../../services/matchService";
import {
    Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Eye, Ban, Loader2, RefreshCcw, X, Calendar, CheckCircle, AlertTriangle, Trophy, Zap, Key
} from "lucide-react";
import { MapName, RankRewardItem, summarizePrize } from "./types";

export default function AdminMatchManager() {
    const [manageLoading, setManageLoading] = useState(false);
    const [manageErr, setManageErr] = useState<string | null>(null);
    const [manageRows, setManageRows] = useState<any[]>([]);
    const [selectedMatchForDetails, setSelectedMatchForDetails] = useState<any>(null);
    const [matchDetailsLoading, setMatchDetailsLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [msg, setMsg] = useState<string | null>(null);

    // Edit form state
    const [form, setForm] = useState({
        name: "",
        entryFee: 0,
        prizePool: 0,
        maxPlayers: 0,
        map: "Erangel" as MapName,
        startTime: "",
    });
    const [rankRewards, setRankRewards] = useState<RankRewardItem[]>([]);
    const [kill, setKill] = useState({ perKill: 0, maxKills: 0 });
    const [customs, setCustoms] = useState<{ name: string; amount: number }[]>([]);

    // Room Details State
    const [showRoomDialog, setShowRoomDialog] = useState(false);
    const [roomDetails, setRoomDetails] = useState({ matchId: "", roomId: "", roomPassword: "" });
    const [sendingRoomDetails, setSendingRoomDetails] = useState(false);

    // Show toast notification
    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const loadMatches = async () => {
        setManageLoading(true);
        setManageErr(null);
        try {
            const data = await matchService.getAllMatches({ status: 'all' }); // Fetch all matches for management
            if (data?.success) {
                setManageRows(data.data);
            } else {
                setManageErr("Failed to load matches");
            }
        } catch (error: any) {
            setManageErr(error?.response?.data?.error || error?.message || "Failed to load matches");
        } finally {
            setManageLoading(false);
        }
    };

    useEffect(() => {
        loadMatches();
    }, []);

    const cancelMatch = async (matchId: string) => {
        try {
            const data = await matchService.updateMatch(matchId, { status: 'cancelled' });
            if (data?.success) {
                showToast("Match cancelled successfully!", "success");
                loadMatches();
            } else {
                showToast("Failed to cancel match", "error");
            }
        } catch (error: any) {
            showToast(error?.response?.data?.error || "Failed to cancel match", "error");
        }
    };

    const deleteMatch = async (matchId: string) => {
        if (!confirm("Are you sure you want to delete this match? This action cannot be undone.")) {
            return;
        }

        try {
            const data = await matchService.deleteMatch(matchId);
            if (data?.success) {
                showToast("Match deleted successfully!", "success");
                loadMatches();
            } else {
                showToast("Failed to delete match", "error");
            }
        } catch (error: any) {
            showToast(error?.response?.data?.error || "Failed to delete match", "error");
        }
    };

    const handleSendRoomDetails = async () => {
        if (!roomDetails.roomId || !roomDetails.roomPassword) {
            showToast("Please enter both Room ID and Password", "error");
            return;
        }

        setSendingRoomDetails(true);
        try {
            const response = await matchService.sendRoomDetails(
                roomDetails.matchId,
                roomDetails.roomId,
                roomDetails.roomPassword
            );

            if (response.success) {
                showToast("Room details sent to all players!", "success");
                setShowRoomDialog(false);
                setRoomDetails({ matchId: "", roomId: "", roomPassword: "" });
            }
        } catch (error: any) {
            showToast(error?.response?.data?.error || "Failed to send room details", "error");
        } finally {
            setSendingRoomDetails(false);
        }
    };

    const loadMatchDetails = async (matchId: string) => {
        setMatchDetailsLoading(true);
        try {
            const data = await matchService.getMatchDetails(matchId);
            if (data?.success) {
                const match = data.data;
                setSelectedMatchForDetails(match);

                // Initialize edit form
                setForm({
                    name: match.name,
                    entryFee: match.entryFee,
                    prizePool: match.prizePool,
                    maxPlayers: match.maxPlayers,
                    map: match.map,
                    startTime: new Date(match.startTime).toISOString().slice(0, 16),
                });
                setRankRewards(match.prizeDistribution.rankRewards.ranks);
                setKill({
                    perKill: match.prizeDistribution.killRewards.perKill,
                    maxKills: match.prizeDistribution.killRewards.maxKills,
                });
                setCustoms(match.prizeDistribution.customRewards);
            } else {
                showToast("Failed to load match details", "error");
            }
        } catch (error: any) {
            showToast(error?.response?.data?.error || "Failed to load match details", "error");
        } finally {
            setMatchDetailsLoading(false);
        }
    };

    // Computed prize distribution for edit mode
    const computed = React.useMemo(() => {
        const pd = summarizePrize({
            rankRewards: { total: 0, ranks: rankRewards },
            killRewards: {
                total: kill.perKill * kill.maxKills,
                perKill: kill.perKill,
                maxKills: kill.maxKills,
            },
            customRewards: customs,
        });
        const over = pd.summary.totalDistributed > form.prizePool;
        return { pd, over, diff: Math.abs(pd.summary.totalDistributed - form.prizePool) };
    }, [rankRewards, kill, customs, form.prizePool]);

    return (
        <div className="space-y-4 mt-4">
            {toast && (
                <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${toast.type === 'success' ? 'bg-green-500 text-black' : 'bg-red-500 text-white'
                    }`}>
                    {toast.message}
                </div>
            )}

            <Card className="bg-gray-900 border-red-500/20">
                <CardHeader className="flex items-center justify-between">
                    <CardTitle className="text-red-400">Active Matches</CardTitle>
                    <div className="flex items-center gap-2">
                        {manageErr && (
                            <span className="text-xs text-red-400 border border-red-500/30 bg-red-500/10 px-2 py-1 rounded">
                                {manageErr}
                            </span>
                        )}
                        <Button
                            size="sm"
                            variant="outline"
                            className="border-blue-500/50 text-blue-400 bg-transparent"
                            onClick={loadMatches}
                            disabled={manageLoading}
                        >
                            {manageLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCcw className="w-4 h-4 mr-2" />}
                            Refresh
                        </Button>
                    </div>
                </CardHeader>

                <CardContent>
                    {manageLoading && (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="animate-pulse flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                                    <div className="space-y-2">
                                        <div className="h-4 w-40 bg-gray-700 rounded" />
                                        <div className="flex gap-3">
                                            <div className="h-3 w-20 bg-gray-700 rounded" />
                                            <div className="h-3 w-12 bg-gray-700 rounded" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!manageLoading && manageRows.length === 0 && (
                        <div className="p-6 text-center text-gray-400 bg-gray-800 rounded-lg">
                            No matches found. Create one in the Create tab.
                        </div>
                    )}

                    <div className="space-y-3">
                        {manageRows.map((match) => (
                            <div key={match._id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                                <div>
                                    <p className="font-medium text-white">{match.name}</p>
                                    <div className="flex items-center space-x-3 text-sm text-gray-400">
                                        <span>
                                            {typeof match.playersJoined === "number"
                                                ? `${match.playersJoined}/${match.maxPlayers}`
                                                : `${match.maxPlayers} max`}{" "}
                                            players
                                        </span>
                                        <span>{new Date(match.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                                        <Badge
                                            className={`${match.status === "live"
                                                ? "bg-red-500/20 text-red-400 border-red-500/30"
                                                : match.status === "upcoming"
                                                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                                                    : match.status === "completed"
                                                        ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                                                        : "bg-gray-500/20 text-gray-300 border-gray-500/30"
                                                }`}
                                        >
                                            {match.status}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-blue-500/50 text-blue-400 bg-transparent"
                                        onClick={() => loadMatchDetails(match._id)}
                                    >
                                        <Eye className="w-4 h-4" />
                                    </Button>

                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-purple-500/50 text-purple-400 bg-transparent"
                                        onClick={() => {
                                            setRoomDetails({ matchId: match._id, roomId: match.roomId || "", roomPassword: match.roomPassword || "" });
                                            setShowRoomDialog(true);
                                        }}
                                        title="Send Room ID"
                                    >
                                        <Key className="w-4 h-4" />
                                    </Button>

                                    {match.status !== "cancelled" && match.status !== "completed" && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-yellow-500/50 text-yellow-400 bg-transparent"
                                            onClick={() => cancelMatch(match._id)}
                                        >
                                            Cancel
                                        </Button>
                                    )}

                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-red-500/50 text-red-400 bg-transparent"
                                        onClick={() => deleteMatch(match._id)}
                                        title="Delete match"
                                    >
                                        <Ban className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Match Details Modal */}
            {selectedMatchForDetails && (
                <div className="fixed inset-0 z-50 bg-black overflow-y-auto">
                    <div className="sticky top-0 bg-black/95 backdrop-blur-sm border-b border-blue-500/20 p-4">
                        <div className="flex items-center justify-between">
                            <h1 className="text-xl font-bold text-blue-400 flex items-center">
                                <Eye className="w-6 h-6 mr-2" />
                                Match Details & Edit
                            </h1>
                            <div className="flex items-center space-x-2">
                                <Badge className={`${selectedMatchForDetails.status === "live"
                                    ? "bg-red-500/20 text-red-400 border-red-500/30"
                                    : selectedMatchForDetails.status === "upcoming"
                                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                                        : selectedMatchForDetails.status === "completed"
                                            ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                                            : "bg-gray-500/20 text-gray-300 border-gray-500/30"
                                    }`}>
                                    {selectedMatchForDetails.status.toUpperCase()}
                                </Badge>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-gray-400 hover:text-white hover:bg-gray-800"
                                    onClick={() => setSelectedMatchForDetails(null)}
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 max-w-7xl mx-auto">
                        <div className="space-y-6">
                            {/* Basic Match Info - Editable */}
                            <Card className="bg-gray-800 border-blue-500/20">
                                <CardHeader>
                                    <CardTitle className="text-blue-400">Basic Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Input
                                        placeholder="Match Name"
                                        className="bg-black border-gray-700 text-white"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm text-gray-400">Entry Fee (₹)</label>
                                            <Input
                                                type="number"
                                                className="bg-black border-gray-700 text-white"
                                                value={form.entryFee}
                                                onChange={(e) => setForm({ ...form, entryFee: Number(e.target.value) || 0 })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm text-gray-400">Prize Pool (₹)</label>
                                            <Input
                                                type="number"
                                                className="bg-black border-gray-700 text-white"
                                                value={form.prizePool}
                                                onChange={(e) => setForm({ ...form, prizePool: Number(e.target.value) || 0 })}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm text-gray-400">Max Players</label>
                                            <Input
                                                type="number"
                                                className="bg-black border-gray-700 text-white"
                                                value={form.maxPlayers}
                                                onChange={(e) => setForm({ ...form, maxPlayers: Number(e.target.value) || 1 })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm text-gray-400">Map</label>
                                            <Select value={form.map} onValueChange={(v) => setForm({ ...form, map: v as MapName })}>
                                                <SelectTrigger className="bg-black border-gray-700 text-white">
                                                    <SelectValue placeholder="Select Map" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-gray-800 border-gray-700">
                                                    {["Erangel", "Sanhok", "Miramar", "Vikendi"].map((m) => (
                                                        <SelectItem key={m} value={m}>
                                                            {m}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm text-gray-400">Start Time</label>
                                        <Input
                                            type="datetime-local"
                                            className="bg-black border-gray-700 text-white"
                                            min={new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16)}
                                            value={form.startTime}
                                            onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Prize Distribution - Editable */}
                            <Card className="bg-gray-800 border-green-500/20">
                                <CardHeader>
                                    <CardTitle className="text-green-400 flex items-center justify-between">
                                        <span className="flex items-center">
                                            <Trophy className="w-5 h-5 mr-2" />
                                            Prize Distribution Settings
                                        </span>
                                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Editable</Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Rank Rewards */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-semibold text-green-400">Rank Rewards</h4>
                                            <div className="flex items-center space-x-2 text-sm text-gray-400">
                                                <span>Total (auto):</span>
                                                <span className="text-green-300 font-semibold">
                                                    ₹{rankRewards.reduce((s, r) => s + (Number(r.amount) || 0), 0)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 gap-2">
                                            {rankRewards.map((prize, i) => (
                                                <div key={prize.rank} className="flex items-center justify-between p-2 bg-gray-900 rounded">
                                                    <div className="font-medium">{prize.rank}</div>
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-gray-400">₹</span>
                                                        <Input
                                                            className="bg-black border-gray-700 text-white w-20 text-center"
                                                            type="number"
                                                            value={prize.amount}
                                                            onChange={(e) => {
                                                                const clone = [...rankRewards];
                                                                clone[i] = { ...clone[i], amount: Number(e.target.value) || 0 };
                                                                setRankRewards(clone);
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Kill Rewards */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-semibold text-red-400">Kill Rewards</h4>
                                            <div className="text-sm text-gray-400">
                                                Total (auto): <span className="text-red-300 font-semibold">₹{kill.perKill * kill.maxKills}</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm text-gray-400">Per Kill Reward</label>
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-gray-400">₹</span>
                                                    <Input
                                                        className="bg-black border-gray-700 text-white"
                                                        type="number"
                                                        value={kill.perKill}
                                                        onChange={(e) => setKill({ ...kill, perKill: Number(e.target.value) || 0 })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm text-gray-400">Max Kill Rewards</label>
                                                <Input
                                                    className="bg-black border-gray-700 text-white"
                                                    type="number"
                                                    value={kill.maxKills}
                                                    onChange={(e) => setKill({ ...kill, maxKills: Number(e.target.value) || 0 })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Custom Rewards */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-semibold text-blue-400">Custom Rewards</h4>
                                            <Button
                                                size="sm"
                                                className="bg-blue-500 hover:bg-blue-600 text-white"
                                                onClick={() => setCustoms((c) => [...c, { name: "New Custom", amount: 0 }])}
                                            >
                                                + Add Custom
                                            </Button>
                                        </div>
                                        <div className="space-y-2">
                                            {customs.map((c, i) => (
                                                <div key={i} className="flex items-center justify-between p-2 bg-gray-900 rounded">
                                                    <div className="flex items-center space-x-3">
                                                        <Zap className="w-4 h-4 text-blue-400" />
                                                        <Input
                                                            value={c.name}
                                                            onChange={(e) => {
                                                                const clone = [...customs];
                                                                clone[i] = { ...clone[i], name: e.target.value };
                                                                setCustoms(clone);
                                                            }}
                                                            className="bg-black border-gray-700 text-white w-56"
                                                        />
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-gray-400">₹</span>
                                                        <Input
                                                            className="bg-black border-gray-700 text-white w-20 text-center"
                                                            type="number"
                                                            value={c.amount}
                                                            onChange={(e) => {
                                                                const clone = [...customs];
                                                                clone[i] = { ...clone[i], amount: Number(e.target.value) || 0 };
                                                                setCustoms(clone);
                                                            }}
                                                        />
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="text-red-400 hover:text-red-300"
                                                            onClick={() => setCustoms((arr) => arr.filter((_, idx) => idx !== i))}
                                                        >
                                                            <Ban className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Summary */}
                                    <div className="p-4 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-semibold text-green-400">Distribution Summary</h4>
                                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Auto-Calculate</Badge>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4 text-center">
                                            <div>
                                                <p className="text-lg font-bold text-yellow-400">₹{computed.pd.summary.rankRewardsTotal}</p>
                                                <p className="text-xs text-gray-400">Rank Rewards</p>
                                            </div>
                                            <div>
                                                <p className="text-lg font-bold text-red-400">₹{computed.pd.summary.killRewardsTotal}</p>
                                                <p className="text-xs text-gray-400">Kill Rewards</p>
                                            </div>
                                            <div>
                                                <p className="text-lg font-bold text-blue-400">₹{computed.pd.summary.customRewardsTotal}</p>
                                                <p className="text-xs text-gray-400">Custom Rewards</p>
                                            </div>
                                        </div>
                                        <div className="mt-3 pt-3 border-t border-gray-700">
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-400">Total Distributed:</span>
                                                <span className={`text-lg font-bold ${computed.over ? "text-red-400" : "text-green-400"}`}>
                                                    ₹{computed.pd.summary.totalDistributed}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-400">Prize Pool:</span>
                                                <span className="text-white">₹{form.prizePool}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className={`${computed.over ? "text-red-400" : "text-green-400"}`}>
                                                    {computed.over ? "Exceeds by:" : "Remaining:"}
                                                </span>
                                                <span className={`font-bold ${computed.over ? "text-red-400" : "text-green-400"}`}>
                                                    ₹{computed.diff}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Match Results (if completed) - Read Only */}
                            {selectedMatchForDetails.results?.isCompleted && (
                                <Card className="bg-gray-800 border-yellow-500/20">
                                    <CardHeader>
                                        <CardTitle className="text-yellow-400">Match Results</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-3">
                                            {selectedMatchForDetails.results.squadRankings.map((squad: any, index: number) => (
                                                <div key={index} className="flex items-center justify-between p-3 bg-gray-900 rounded">
                                                    <div className="flex items-center space-x-4">
                                                        <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center font-bold text-black">
                                                            {squad.rank}
                                                        </div>
                                                        <span className="text-white font-medium">{squad.squadName}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-4 text-sm">
                                                        <span className="text-gray-400">Kills: <span className="text-white">{squad.kills}</span></span>
                                                        <span className="text-gray-400">Damage: <span className="text-white">{squad.damage}</span></span>
                                                        <span className="text-green-400 font-medium">₹{squad.prizeAmount}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Action Buttons */}
                            <div className="flex space-x-4">
                                <Button
                                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                                    onClick={async () => {
                                        try {
                                            // Update the match with new data
                                            const matchData = {
                                                name: form.name,
                                                entryFee: form.entryFee,
                                                prizePool: form.prizePool,
                                                maxPlayers: form.maxPlayers,
                                                map: form.map,
                                                startTime: new Date(form.startTime).toISOString(),
                                                prizeDistribution: computed.pd,
                                            };
                                            const data = await matchService.updateMatch(selectedMatchForDetails._id, matchData);

                                            if (data?.success) {
                                                showToast("Match updated successfully!", "success");
                                                setSelectedMatchForDetails(null);
                                                setMsg(null);
                                                loadMatches();
                                            }
                                        } catch (error: any) {
                                            setMsg(error?.response?.data?.error || "Failed to update match");
                                        }
                                    }}
                                    disabled={computed.over}
                                >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Update Match
                                </Button>

                                <Button
                                    variant="outline"
                                    className="flex-1 border-gray-600 text-gray-400 bg-transparent"
                                    onClick={() => {
                                        setSelectedMatchForDetails(null);
                                        setMsg(null);
                                    }}
                                >
                                    Close
                                </Button>
                            </div>

                            {/* Success/Error Toast inside Modal */}
                            {msg && (
                                <div
                                    className={`fixed top-20 right-6 z-60 text-sm p-4 rounded-lg shadow-lg border transition-all duration-300 ${msg.toLowerCase().includes("success")
                                        ? "bg-green-500/90 text-green-100 border-green-400/50"
                                        : "bg-red-500/90 text-red-100 border-red-400/50"
                                        }`}
                                >
                                    <div className="flex items-center space-x-2">
                                        {msg.toLowerCase().includes("success") ? (
                                            <CheckCircle className="w-5 h-5 text-green-200" />
                                        ) : (
                                            <AlertTriangle className="w-5 h-5 text-red-200" />
                                        )}
                                        <span className="font-medium">{msg}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Send Room Details Dialog */}
            <Dialog open={showRoomDialog} onOpenChange={setShowRoomDialog}>
                <DialogContent className="bg-gray-900 border-gray-800 text-white">
                    <DialogHeader>
                        <DialogTitle className="flex items-center text-purple-400">
                            <Key className="w-5 h-5 mr-2" />
                            Send Room Details
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">Room ID</label>
                            <Input
                                value={roomDetails.roomId}
                                onChange={(e) => setRoomDetails({ ...roomDetails, roomId: e.target.value })}
                                className="bg-black border-gray-700 text-white"
                                placeholder="Enter Room ID"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">Room Password</label>
                            <Input
                                value={roomDetails.roomPassword}
                                onChange={(e) => setRoomDetails({ ...roomDetails, roomPassword: e.target.value })}
                                className="bg-black border-gray-700 text-white"
                                placeholder="Enter Room Password"
                            />
                        </div>
                        <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded text-xs text-yellow-200 flex items-start">
                            <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                            <p>This will send a Push Notification and In-App Notification to all registered players immediately.</p>
                        </div>
                        <Button
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                            onClick={handleSendRoomDetails}
                            disabled={sendingRoomDetails}
                        >
                            {sendingRoomDetails ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Zap className="w-4 h-4 mr-2" />
                                    Send Details Now
                                </>
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
