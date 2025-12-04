"use client";

import React, { useState, useEffect } from "react";
import { squadService } from "../../services/squadService";
import {
    Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
    Search, Filter, Shield, Loader2, Users, Eye, Trash2, CheckCircle, AlertTriangle
} from "lucide-react";

export default function AdminSquadManager() {
    const [squads, setSquads] = useState<any[]>([]);
    const [squadsLoading, setSquadsLoading] = useState(false);
    const [squadsError, setSquadsError] = useState<string | null>(null);
    const [squadSearch, setSquadSearch] = useState("");
    const [squadStatusFilter, setSquadStatusFilter] = useState("all");
    const [squadPagination, setSquadPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [selectedSquad, setSelectedSquad] = useState<any>(null);
    const [squadActionLoading, setSquadActionLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Show toast notification
    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const loadSquads = async (page = 1, search = "", status = "all") => {
        setSquadsLoading(true);
        setSquadsError(null);
        try {
            const params: any = {
                page: page.toString(),
                limit: "10",
            };
            if (search) params.search = search;
            if (status !== "all") params.status = status;

            const data = await squadService.getSquads(params);

            if (data?.success) {
                setSquads(data.data);
                setSquadPagination(data.pagination);
            } else {
                setSquadsError("Failed to load squads");
            }
        } catch (error: any) {
            setSquadsError(error?.response?.data?.error || "Failed to load squads");
        } finally {
            setSquadsLoading(false);
        }
    };

    useEffect(() => {
        loadSquads();
    }, []);

    const loadSquadDetails = async (squadId: string) => {
        try {
            const data = await squadService.getSquadDetails(squadId);
            if (data?.success) {
                setSelectedSquad(data.data);
            }
        } catch (error: any) {
            showToast(error?.response?.data?.error || "Failed to load squad details", "error");
        }
    };

    const deleteSquad = async (squadId: string) => {
        if (!confirm("Are you sure you want to delete this squad? This action cannot be undone.")) {
            return;
        }

        setSquadActionLoading(true);
        try {
            const data = await squadService.deleteSquad(squadId);

            if (data?.success) {
                showToast("Squad deleted successfully", "success");
                loadSquads(squadPagination.page, squadSearch, squadStatusFilter);
                if (selectedSquad && selectedSquad._id === squadId) {
                    setSelectedSquad(null);
                }
            }
        } catch (error: any) {
            showToast(error?.response?.data?.error || "Failed to delete squad", "error");
        } finally {
            setSquadActionLoading(false);
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

            <Card className="bg-gray-900 border-green-500/20">
                <CardHeader>
                    <CardTitle className="text-green-400 flex items-center justify-between">
                        Squad Management & Administration
                        <div className="flex space-x-2">
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                <Shield className="w-3 h-3 mr-1" />
                                Admin Access
                            </Badge>
                        </div>
                    </CardTitle>
                </CardHeader>

                <CardContent>
                    {/* Search and Filter Controls */}
                    <div className="flex space-x-2 mb-4">
                        <Input
                            placeholder="Search squads by name, member, or PUBG ID..."
                            className="bg-black border-gray-700 text-white flex-1"
                            value={squadSearch}
                            onChange={(e) => setSquadSearch(e.target.value)}
                        />
                        <Select value={squadStatusFilter} onValueChange={(value) => setSquadStatusFilter(value)}>
                            <SelectTrigger className="bg-black border-gray-700 text-white w-32">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-700">
                                <SelectItem value="all">All Squads</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button
                            size="sm"
                            variant="outline"
                            className="border-blue-500/50 text-blue-400 bg-transparent"
                            onClick={() => loadSquads(1, squadSearch, squadStatusFilter)}
                            disabled={squadsLoading}
                        >
                            {squadsLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                            Search
                        </Button>
                    </div>

                    {/* Squads List */}
                    {squadsLoading ? (
                        <div className="text-center py-8">
                            <Loader2 className="w-8 h-8 animate-spin text-green-400 mx-auto mb-4" />
                            <p className="text-gray-400">Loading squads...</p>
                        </div>
                    ) : squadsError ? (
                        <div className="text-center py-8">
                            <p className="text-red-400">{squadsError}</p>
                            <Button
                                onClick={() => loadSquads(1, squadSearch, squadStatusFilter)}
                                className="mt-2 bg-green-500 hover:bg-green-600 text-black"
                            >
                                Retry
                            </Button>
                        </div>
                    ) : squads.length === 0 ? (
                        <div className="text-center py-8">
                            <Users className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                            <p className="text-gray-400">No squads found</p>
                            <p className="text-sm text-gray-500">Try adjusting your search criteria</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {squads.map((squad) => (
                                <Card key={squad._id} className="bg-gray-800 border-gray-700">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3 mb-2">
                                                    <h4 className="font-medium text-green-400">{squad.name}</h4>
                                                    <Badge className={`${squad.status === "active"
                                                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                                                        : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                                                        }`}>
                                                        {squad.status}
                                                    </Badge>
                                                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                                                        {squad.members.length}/{squad.maxMembers} members
                                                    </Badge>
                                                </div>
                                                <div className="text-sm text-gray-400 space-y-1">
                                                    <p>Leader: {squad.leader?.name || 'Unknown'}</p>
                                                    <p>Created: {new Date(squad.createdAt).toLocaleDateString()}</p>
                                                    {squad.stats && (
                                                        <p>Stats: {squad.stats.matchesWon || 0} wins, {squad.stats.totalKills || 0} kills</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex space-x-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-blue-500/50 text-blue-400 bg-transparent"
                                                    onClick={() => loadSquadDetails(squad._id)}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-red-500/50 text-red-400 bg-transparent"
                                                    onClick={() => deleteSquad(squad._id)}
                                                    disabled={squadActionLoading}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {squadPagination.pages > 1 && (
                        <div className="flex items-center justify-center space-x-2 mt-6">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => loadSquads(squadPagination.page - 1, squadSearch, squadStatusFilter)}
                                disabled={squadPagination.page <= 1}
                            >
                                Previous
                            </Button>
                            <span className="text-sm text-gray-400">
                                Page {squadPagination.page} of {squadPagination.pages}
                            </span>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => loadSquads(squadPagination.page + 1, squadSearch, squadStatusFilter)}
                                disabled={squadPagination.page >= squadPagination.pages}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Squad Details Modal */}
            {selectedSquad && (
                <Dialog open={!!selectedSquad} onOpenChange={() => setSelectedSquad(null)}>
                    <DialogContent className="bg-gray-900 border-green-500/30 text-white max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-green-400 flex items-center justify-between">
                                <span>{selectedSquad.name}</span>
                                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                    {selectedSquad.status.toUpperCase()}
                                </Badge>
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-6">
                            {/* Squad Stats */}
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="p-3 bg-gray-800 rounded-lg">
                                    <p className="text-2xl font-bold text-yellow-400">{selectedSquad.stats?.matchesWon || 0}</p>
                                    <p className="text-xs text-gray-400">Wins</p>
                                </div>
                                <div className="p-3 bg-gray-800 rounded-lg">
                                    <p className="text-2xl font-bold text-red-400">{selectedSquad.stats?.totalKills || 0}</p>
                                    <p className="text-xs text-gray-400">Kills</p>
                                </div>
                                <div className="p-3 bg-gray-800 rounded-lg">
                                    <p className="text-2xl font-bold text-blue-400">{selectedSquad.members.length}</p>
                                    <p className="text-xs text-gray-400">Members</p>
                                </div>
                            </div>

                            {/* Members List */}
                            <div className="space-y-3">
                                <h4 className="font-semibold text-gray-300">Squad Members</h4>
                                <div className="space-y-2">
                                    {selectedSquad.members.map((member: any, index: number) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-2 h-2 rounded-full ${member.role === 'leader' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                                                <div>
                                                    <p className="text-sm font-medium text-white">
                                                        {member.userId?.name || 'Unknown User'}
                                                        {member.role === 'leader' && <span className="text-xs text-yellow-400 ml-2">(Leader)</span>}
                                                    </p>
                                                    <p className="text-xs text-gray-400">{member.userId?.pubgId || 'No PUBG ID'}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-400">Joined: {new Date(member.joinedAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Match History */}
                            {selectedSquad.matchHistory && selectedSquad.matchHistory.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-gray-300">Recent Matches</h4>
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                        {selectedSquad.matchHistory.map((match: any, index: number) => (
                                            <div key={index} className="flex justify-between items-center p-2 bg-gray-800 rounded text-sm">
                                                <span className="text-white">{match.matchId?.name || 'Unknown Match'}</span>
                                                <div className="flex items-center space-x-3">
                                                    <span className="text-yellow-400">Rank: #{match.rank}</span>
                                                    <span className="text-red-400">{match.kills} Kills</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
