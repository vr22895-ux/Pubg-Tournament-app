"use client";

import React, { useState, useMemo } from "react";
import { matchService } from "../../services/matchService";
import {
    Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
    Calendar, Trophy, Zap, Ban,
} from "lucide-react";
import { MapName, RankRewardItem, summarizePrize } from "./types";

export default function AdminCreateMatch({ onMatchCreated }: { onMatchCreated: () => void }) {
    // Form state
    const [form, setForm] = useState({
        name: "Championship Battle",
        entryFee: 100,
        prizePool: 8000,
        maxPlayers: 88,
        map: "Erangel" as MapName,
        startTime: "", // datetime-local
    });

    const [rankRewards, setRankRewards] = useState<RankRewardItem[]>([
        { rank: "1st Place", amount: 3000 },
        { rank: "2nd Place", amount: 1500 },
        { rank: "3rd Place", amount: 800 },
        { rank: "4th Place", amount: 400 },
        { rank: "5th Place", amount: 300 },
    ]);

    const [kill, setKill] = useState({ perKill: 50, maxKills: 10 });
    const [customs, setCustoms] = useState<{ name: string; amount: number }[]>([
        { name: "Most Damage Dealt", amount: 200 },
        { name: "Longest Survival", amount: 150 },
    ]);

    const [creating, setCreating] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const computed = useMemo(() => {
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

    // Show toast notification
    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        // Auto-hide toast after 3 seconds
        setTimeout(() => setToast(null), 3000);
    };

    const onSubmit = async () => {
        setMsg(null);
        if (!form.startTime) {
            showToast("Please select a start time", "error");
            return;
        }
        if (computed.over) {
            showToast("Total distributed exceeds prize pool", "error");
            return;
        }
        setCreating(true);
        try {
            const startISO = new Date(form.startTime).toISOString();

            const matchData = {
                name: form.name,
                entryFee: form.entryFee,
                prizePool: form.prizePool,
                maxPlayers: form.maxPlayers,
                map: form.map,
                startTime: startISO,
                prizeDistribution: computed.pd,
            };

            const data = await matchService.createMatch(matchData);

            if (data?.success) {
                showToast("Match created successfully!", "success");
                onMatchCreated(); // Switch to manage tab
            }
        } catch (e: any) {
            showToast(e?.response?.data?.error || e?.message || "Failed to create match", "error");
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="space-y-6 mt-4">
            {toast && (
                <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${toast.type === 'success' ? 'bg-green-500 text-black' : 'bg-red-500 text-white'
                    }`}>
                    {toast.message}
                </div>
            )}

            <Card className="bg-gray-900 border-red-500/20">
                <CardHeader>
                    <CardTitle className="text-red-400">Create New Match</CardTitle>
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

                    {/* Prize Distribution */}
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
                                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded">
                                    <p className="text-sm text-red-300">
                                        Kill rewards will be distributed to top killers automatically after match completion
                                    </p>
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

                    {msg && (
                        <div
                            className={`text-sm p-2 rounded ${msg.toLowerCase().includes("success")
                                ? "bg-green-500/10 text-green-300 border border-green-500/30"
                                : "bg-red-500/10 text-red-300 border border-red-500/30"
                                }`}
                        >
                            {msg}
                        </div>
                    )}

                    <Button
                        className="w-full bg-red-500 hover:bg-red-600 text-white"
                        disabled={creating}
                        onClick={onSubmit}
                    >
                        <Calendar className="w-4 h-4 mr-2" />
                        {creating ? "Scheduling…" : "Schedule Match with Custom Prizes"}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
