"use client";

import React, { useState, useEffect } from "react";
import { matchService } from "../../services/matchService";
import { resultsService } from "../../services/resultsService";
import {
    Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Loader2, RefreshCcw, CheckCircle, Trophy, Shield, Users, AlertTriangle
} from "lucide-react";

export default function AdminResultsManager() {
    const [resultsLoading, setResultsLoading] = useState(false);
    const [completedMatches, setCompletedMatches] = useState<any[]>([]);
    const [selectedMatch, setSelectedMatch] = useState<any>(null);
    const [uploadingResults, setUploadingResults] = useState(false);
    const [matchParticipants, setMatchParticipants] = useState<any[]>([]);
    const [participantsLoading, setParticipantsLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const [resultsForm, setResultsForm] = useState({
        totalParticipants: 0,
        matchDuration: 0,
        squadRankings: [
            { rank: 1, squadName: "", kills: 0, damage: 0, survivalTime: 0 },
            { rank: 2, squadName: "", kills: 0, damage: 0, survivalTime: 0 },
            { rank: 3, squadName: "", kills: 0, damage: 0, survivalTime: 0 },
            { rank: 4, squadName: "", kills: 0, damage: 0, survivalTime: 0 },
            { rank: 5, squadName: "", kills: 0, damage: 0, survivalTime: 0 },
        ],
        specialAwards: [] as { name: string; recipient: string; amount: number }[],
        notes: "",
    });

    // Show toast notification
    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const loadCompletedMatches = async () => {
        setResultsLoading(true);
        try {
            const data = await matchService.getCompletedMatches();
            if (data?.success) {
                setCompletedMatches(data.data);
            }
        } catch (error: any) {
            console.error("Failed to load completed matches:", error);
        } finally {
            setResultsLoading(false);
        }
    };

    useEffect(() => {
        loadCompletedMatches();
    }, []);

    const handleAutoUpdateStatuses = async () => {
        try {
            const data = await matchService.autoUpdateStatuses();
            if (data?.success) {
                showToast(`Statuses updated: ${data.data.started} started, ${data.data.completed} completed`, "success");
                loadCompletedMatches();
            }
        } catch (error: any) {
            showToast(error?.response?.data?.error || "Failed to update match statuses", "error");
        }
    };

    const loadMatchParticipants = async (matchId: string) => {
        setParticipantsLoading(true);
        try {
            const data = await matchService.getMatchRegistrations(matchId);
            if (data?.success) {
                setMatchParticipants(data.data.registeredPlayers);
            }
        } catch (error: any) {
            console.error("Failed to load participants:", error);
            showToast("Failed to load participants", "error");
        } finally {
            setParticipantsLoading(false);
        }
    };

    const handleMatchSelection = (matchId: string) => {
        const match = completedMatches.find(m => m._id === matchId);
        setSelectedMatch(match);

        setResultsForm({
            totalParticipants: 0,
            matchDuration: 0,
            squadRankings: [
                { rank: 1, squadName: "", kills: 0, damage: 0, survivalTime: 0 },
                { rank: 2, squadName: "", kills: 0, damage: 0, survivalTime: 0 },
                { rank: 3, squadName: "", kills: 0, damage: 0, survivalTime: 0 },
                { rank: 4, squadName: "", kills: 0, damage: 0, survivalTime: 0 },
                { rank: 5, squadName: "", kills: 0, damage: 0, survivalTime: 0 },
            ],
            specialAwards: [],
            notes: "",
        });

        if (match) {
            loadMatchParticipants(matchId);

            const updatedAwards = match.prizeDistribution.customRewards.map((award: any) => ({
                name: award.name,
                recipient: "",
                amount: award.amount,
            }));

            setResultsForm(prev => ({
                ...prev,
                specialAwards: updatedAwards,
            }));
        }
    };

    const handleSquadRankingChange = (index: number, field: keyof typeof resultsForm.squadRankings[0], value: string | number) => {
        const updatedRankings = [...resultsForm.squadRankings];
        updatedRankings[index] = { ...updatedRankings[index], [field]: value };
        setResultsForm(prev => ({ ...prev, squadRankings: updatedRankings }));
    };

    const handleSpecialAwardChange = (index: number, field: keyof typeof resultsForm.specialAwards[0], value: string | number) => {
        const updatedAwards = [...resultsForm.specialAwards];
        updatedAwards[index] = { ...updatedAwards[index], [field]: value };
        setResultsForm(prev => ({ ...prev, specialAwards: updatedAwards }));
    };

    const handleUploadResults = async () => {
        if (!selectedMatch) {
            showToast("Please select a match first", "error");
            return;
        }

        if (resultsForm.totalParticipants === 0) {
            showToast("Please enter total participants", "error");
            return;
        }

        if (resultsForm.matchDuration === 0) {
            showToast("Please enter match duration", "error");
            return;
        }

        const validRankings = resultsForm.squadRankings.filter(
            squad => squad.squadName !== "" && squad.squadName.trim() !== "" && squad.kills >= 0
        );

        if (validRankings.length === 0) {
            showToast("Please enter at least one squad ranking", "error");
            return;
        }

        setUploadingResults(true);
        try {
            const resultsData = {
                matchId: selectedMatch._id,
                results: {
                    ...resultsForm,
                    squadRankings: validRankings,
                },
            };
            const data = await resultsService.uploadResults(selectedMatch._id, resultsData);

            if (data?.success) {
                showToast("Results uploaded successfully!", "success");
                setSelectedMatch(null);
                setResultsForm({
                    totalParticipants: 0,
                    matchDuration: 0,
                    squadRankings: [
                        { rank: 1, squadName: "", kills: 0, damage: 0, survivalTime: 0 },
                        { rank: 2, squadName: "", kills: 0, damage: 0, survivalTime: 0 },
                        { rank: 3, squadName: "", kills: 0, damage: 0, survivalTime: 0 },
                        { rank: 4, squadName: "", kills: 0, damage: 0, survivalTime: 0 },
                        { rank: 5, squadName: "", kills: 0, damage: 0, survivalTime: 0 },
                    ],
                    specialAwards: [],
                    notes: "",
                });
                loadCompletedMatches();
            }
        } catch (error: any) {
            showToast(error?.response?.data?.error || "Failed to upload results", "error");
        } finally {
            setUploadingResults(false);
        }
    };

    return (
        <div className="space-y-4 mt-4">
            {toast && (
                <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${toast.type === 'success' ? 'bg-green-500 text-black' : 'bg-red-500 text-white'
                    }`}>
                    {toast.message}
                </div>
            )}

            <Card className="bg-gray-900 border-red-500/20">
                <CardHeader>
                    <CardTitle className="text-red-400 flex items-center justify-between">
                        Upload Match Results
                        <Button
                            size="sm"
                            variant="outline"
                            className="border-blue-500/50 text-blue-400 bg-transparent"
                            onClick={handleAutoUpdateStatuses}
                        >
                            <RefreshCcw className="w-4 h-4 mr-2" />
                            Update Statuses
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Match Selection */}
                    <div className="space-y-2">
                        <label className="text-sm text-gray-400">Select Match for Results Upload</label>
                        <Select onValueChange={handleMatchSelection} disabled={resultsLoading}>
                            <SelectTrigger className="bg-black border-gray-700 text-white">
                                <SelectValue placeholder={
                                    resultsLoading
                                        ? "Loading matches..."
                                        : completedMatches.length === 0
                                            ? "No matches found"
                                            : "Select Match for Results"
                                } />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-700">
                                {completedMatches.map((match) => {
                                    const startDate = new Date(match.startTime);
                                    const statusColor = match.status === 'upcoming' ? 'text-blue-400' :
                                        match.status === 'live' ? 'text-green-400' :
                                            match.status === 'completed' ? 'text-yellow-400' : 'text-gray-400';

                                    return (
                                        <SelectItem key={match._id} value={match._id}>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{match.name}</span>
                                                <span className="text-sm text-gray-400">
                                                    {startDate.toLocaleDateString()} at {startDate.toLocaleTimeString()} -
                                                    <span className={statusColor}> {match.status}</span>
                                                </span>
                                            </div>
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedMatch && (
                        <>
                            {/* Match Info */}
                            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                <h4 className="font-semibold text-blue-400 mb-2">Match Details</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-400">Name:</span>
                                        <span className="text-white ml-2">{selectedMatch.name}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-400">Map:</span>
                                        <span className="text-white ml-2">{selectedMatch.map}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-400">Prize Pool:</span>
                                        <span className="text-white ml-2">₹{selectedMatch.prizePool.toLocaleString()}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-400">Entry Fee:</span>
                                        <span className="text-white ml-2">₹{selectedMatch.entryFee}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Participants Info */}
                            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                                <h4 className="font-semibold text-green-400 mb-2 flex items-center">
                                    <Shield className="w-4 h-4 mr-2" />
                                    Match Participants
                                </h4>
                                {participantsLoading ? (
                                    <div className="flex items-center space-x-2">
                                        <Loader2 className="w-4 h-4 animate-spin text-green-400" />
                                        <span className="text-sm text-gray-400">Loading participants...</span>
                                    </div>
                                ) : matchParticipants.length === 0 ? (
                                    <div className="text-center py-4">
                                        <Users className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                                        <p className="text-sm text-gray-400">No participants available</p>
                                        <p className="text-xs text-gray-500">Participants API not yet implemented</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2">
                                        {matchParticipants.slice(0, 6).map((participant) => (
                                            <div key={participant._id} className="flex items-center space-x-2 p-2 bg-gray-800 rounded">
                                                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                                <span className="text-sm text-white">{participant.name}</span>
                                                <span className="text-xs text-gray-400">({participant.pubgId})</span>
                                            </div>
                                        ))}
                                        {matchParticipants.length > 6 && (
                                            <div className="text-sm text-gray-400 text-center p-2">
                                                +{matchParticipants.length - 6} more participants
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Basic Match Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-400">Total Participants</label>
                                    <Input
                                        type="number"
                                        className="bg-black border-gray-700 text-white"
                                        value={resultsForm.totalParticipants}
                                        onChange={(e) => setResultsForm(prev => ({ ...prev, totalParticipants: Number(e.target.value) || 0 }))}
                                        placeholder="Enter total participants"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-400">Match Duration (minutes)</label>
                                    <Input
                                        type="number"
                                        className="bg-black border-gray-700 text-white"
                                        value={resultsForm.matchDuration}
                                        onChange={(e) => setResultsForm(prev => ({ ...prev, matchDuration: Number(e.target.value) || 0 }))}
                                        placeholder="Enter duration in minutes"
                                    />
                                </div>
                            </div>

                            {/* Squad Rankings */}
                            <div className="space-y-3">
                                <h4 className="font-semibold text-green-400">Top 5 Squad Rankings</h4>
                                {participantsLoading ? (
                                    <div className="text-center py-4">
                                        <Loader2 className="w-6 h-6 mx-auto animate-spin text-blue-400" />
                                        <p className="text-sm text-gray-400 mt-2">Loading participants...</p>
                                    </div>
                                ) : matchParticipants.length === 0 ? (
                                    <div className="text-center py-4 text-gray-400">
                                        <p>No participants found for this match</p>
                                    </div>
                                ) : (
                                    resultsForm.squadRankings.map((squad, index) => (
                                        <div key={index} className="flex items-center space-x-4 p-3 bg-gray-800 rounded-lg">
                                            <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center font-bold text-black">
                                                {squad.rank}
                                            </div>
                                            <Select onValueChange={(value) => handleSquadRankingChange(index, 'squadName', value)}>
                                                <SelectTrigger className="bg-black border-gray-700 text-white">
                                                    <SelectValue placeholder={`${squad.rank === 1 ? "1st" : squad.rank === 2 ? "2nd" : squad.rank === 3 ? "3rd" : `${squad.rank}th`} Place Squad`} />
                                                </SelectTrigger>
                                                <SelectContent className="bg-gray-800 border-gray-700">
                                                    {matchParticipants.length === 0 ? (
                                                        <div className="px-2 py-2 text-sm text-gray-400 text-center">
                                                            No participants available yet
                                                        </div>
                                                    ) : (
                                                        matchParticipants.map((participant) => (
                                                            <SelectItem key={participant._id} value={participant.name}>
                                                                {participant.name} ({participant.pubgId})
                                                            </SelectItem>
                                                        ))
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <Input
                                                placeholder="Kills"
                                                className="bg-black border-gray-700 text-white w-20"
                                                type="number"
                                                value={squad.kills}
                                                onChange={(e) => {
                                                    const updatedRankings = [...resultsForm.squadRankings];
                                                    updatedRankings[index].kills = Number(e.target.value) || 0;
                                                    setResultsForm(prev => ({ ...prev, squadRankings: updatedRankings }));
                                                }}
                                            />
                                            <Input
                                                placeholder="Damage"
                                                className="bg-black border-gray-700 text-white w-24"
                                                type="number"
                                                value={squad.damage}
                                                onChange={(e) => {
                                                    const updatedRankings = [...resultsForm.squadRankings];
                                                    updatedRankings[index].damage = Number(e.target.value) || 0;
                                                    setResultsForm(prev => ({ ...prev, squadRankings: updatedRankings }));
                                                }}
                                            />
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Special Awards */}
                            <div className="space-y-3">
                                <h4 className="font-semibold text-purple-400">Special Awards</h4>
                                {resultsForm.specialAwards.map((award, index) => (
                                    <div key={index} className="flex items-center space-x-4 p-3 bg-gray-800 rounded-lg">
                                        <div className="w-24 text-sm text-purple-400 font-medium">
                                            {award.name}
                                        </div>
                                        <Select onValueChange={(value) => handleSpecialAwardChange(index, 'recipient', value)}>
                                            <SelectTrigger className="bg-black border-gray-700 text-white">
                                                <SelectValue placeholder="Select Recipient" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-gray-800 border-gray-700">
                                                {matchParticipants.length === 0 ? (
                                                    <div className="px-2 py-2 text-sm text-gray-400 text-center">
                                                        No participants available yet
                                                    </div>
                                                ) : (
                                                    matchParticipants.map((participant) => (
                                                        <SelectItem key={participant._id} value={participant.name}>
                                                            {participant.name} ({participant.pubgId})
                                                        </SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <div className="w-20 text-sm text-green-400">
                                            ₹{award.amount}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Notes */}
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400">Additional Notes</label>
                                <Textarea
                                    placeholder="Enter any additional notes about the match..."
                                    className="bg-black border-gray-700 text-white"
                                    value={resultsForm.notes}
                                    onChange={(e) => setResultsForm(prev => ({ ...prev, notes: e.target.value }))}
                                    rows={3}
                                />
                            </div>

                            {/* Upload Button */}
                            <Button
                                className="w-full bg-green-500 hover:bg-green-600 text-black"
                                onClick={handleUploadResults}
                                disabled={uploadingResults}
                            >
                                {uploadingResults ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Uploading Results...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Upload Results & Distribute Prizes
                                    </>
                                )}
                            </Button>
                        </>
                    )}

                    {!selectedMatch && !resultsLoading && completedMatches.length === 0 && (
                        <div className="text-center text-gray-400 py-8">
                            <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                            <p>No matches found</p>
                            <p className="text-sm">Create matches first, then they will appear here for results upload</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
