"use client";

import React, { useState, useEffect } from "react";
import { squadService } from "../services/squadService";
import { invitationService } from "../services/invitationService";
import { authService } from "../services/authService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Users, Crown, Shield, Plus, LogOut, UserPlus, Search, X, Edit, Trash2, Home, Gamepad2, Trophy, Wallet, Settings } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SquadScreen({ onLogout, onNavigate }: { onLogout: () => void; onNavigate?: (screen: "home" | "squad" | "wallet" | "matches" | "leaderboard" | "live" | "settings") => void }) {
  const [squad, setSquad] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateSquad, setShowCreateSquad] = useState(false);
  const [squadName, setSquadName] = useState("");

  // Squad search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<"mySquad" | "findSquad">("mySquad");

  // Squad management state
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [showEditSquad, setShowEditSquad] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", maxMembers: 4 });
  const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);
  const [invitationsLoading, setInvitationsLoading] = useState(false);
  const [availablePlayers, setAvailablePlayers] = useState<any[]>([]);
  const [playersLoading, setPlayersLoading] = useState(false);
  const [playerSearch, setPlayerSearch] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [joinRequestsLoading, setJoinRequestsLoading] = useState(false);

  const getCurrentUser = () => {
    try {
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;
      return user;
    } catch (error) {
      console.error('Error in getCurrentUser:', error);
      return null;
    }
  };

  const loadSquad = async (keepExistingOnError = false) => {
    setLoading(true);
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        setLoading(false);
        return;
      }

      const response = await squadService.getMySquad();

      if (response.success) {
        setSquad(response.data);
        // Initialize edit form
        setEditForm({
          name: response.data.name,
          maxMembers: response.data.maxMembers
        });
      } else {
        if (!keepExistingOnError) {
          setSquad(null);
        }
      }
    } catch (error: any) {
      console.error('Error loading squad:', error);
      // If keepExistingOnError is true, don't clear the squad data
      if (!keepExistingOnError) {
        setSquad(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const createSquad = async () => {
    if (!squadName.trim()) return;

    try {
      const currentUser = getCurrentUser();
      if (!currentUser) return;

      const response = await squadService.createSquad({
        name: squadName,
        leaderId: currentUser._id
      });

      if (response.success) {
        setSquad(response.data);
        setShowCreateSquad(false);
        showToast("Squad created successfully!", "success");
      }
    } catch (error: any) {
      showToast(error.response?.data?.error || "Failed to create squad", "error");
    }
  };

  const joinSquad = async (squadId: string) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) return;

      const response = await squadService.joinSquad(squadId);

      if (response.success) {
        showToast("Join request sent successfully!", "success");
        // Refresh squad list to show updated status if needed
        loadAllSquads();
      }
    } catch (error: any) {
      showToast(error.response?.data?.error || "Failed to join squad", "error");
    }
  };

  const leaveSquad = async () => {
    if (!squad) return;

    if (!confirm("Are you sure you want to leave this squad?")) return;

    try {
      const currentUser = getCurrentUser();
      if (!currentUser) return;

      const response = await squadService.leaveSquad(squad._id);

      if (response.success) {
        setSquad(null);
        showToast("Left squad successfully", "success");
      }
    } catch (error: any) {
      showToast(error.response?.data?.error || "Failed to leave squad", "error");
    }
  };

  const deleteSquad = async () => {
    if (!squad) return;

    if (!confirm("Are you sure you want to delete this squad? This action cannot be undone.")) return;

    try {
      const response = await squadService.deleteSquad(squad._id);

      if (response.success) {
        setSquad(null);
        showToast("Squad deleted successfully", "success");
      }
    } catch (error: any) {
      showToast(error.response?.data?.error || "Failed to delete squad", "error");
    }
  };

  const showToast = (message: string, type: "success" | "error" = "success") => {
    alert(`${type === "success" ? "✅" : "❌"} ${message}`);
  };

  // Load pending invitations
  const loadPendingInvitations = async () => {
    setInvitationsLoading(true);
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) return;

      const response = await invitationService.getUserInvitations(currentUser._id);
      if (response.success) {
        setPendingInvitations(response.data);
      }
    } catch (error) {
      console.error("Failed to load invitations:", error);
    } finally {
      setInvitationsLoading(false);
    }
  };

  // Load join requests (for squad leader)
  const loadJoinRequests = async () => {
    if (!squad) return;

    const currentUser = getCurrentUser();
    if (!currentUser || currentUser._id !== squad.leader) return;

    setJoinRequestsLoading(true);
    try {
      const response = await invitationService.getSquadJoinRequests(squad._id);
      if (response.success) {
        setJoinRequests(response.data);
      }
    } catch (error) {
      console.error("Failed to load join requests:", error);
    } finally {
      setJoinRequestsLoading(false);
    }
  };

  // Accept invitation
  const acceptInvitation = async (invitationId: string) => {
    try {
      const response = await invitationService.acceptInvitation(invitationId);
      if (response.success) {
        // Remove the accepted invitation from the list
        setPendingInvitations(prev => prev.filter(inv => inv._id !== invitationId));
        // Show success message
        showToast("✅ Successfully joined squad!");
        // Reload squad data
        loadSquad();
      }
    } catch (error: any) {
      showToast(`❌ ${error.response?.data?.error || "Failed to accept invitation"}`, "error");
    }
  };

  // Decline invitation
  const declineInvitation = async (invitationId: string) => {
    try {
      const response = await invitationService.declineInvitation(invitationId);
      if (response.success) {
        // Remove the declined invitation from the list
        setPendingInvitations(prev => prev.filter(inv => inv._id !== invitationId));
        // Show success message
        showToast("✅ Invitation declined");
      }
    } catch (error: any) {
      showToast(`❌ ${error.response?.data?.error || "Failed to decline invitation"}`, "error");
    }
  };

  // Accept join request (squad leader)
  const acceptJoinRequest = async (invitationId: string) => {
    try {
      const response = await invitationService.acceptJoinRequest(invitationId);
      if (response.success) {
        showToast("Join request accepted!", "success");
        // Remove the accepted request from the list
        setJoinRequests(prev => prev.filter(req => req._id !== invitationId));
        // Reload squad data
        loadSquad();
      }
    } catch (error: any) {
      showToast(`❌ ${error.response?.data?.error || "Failed to accept join request"}`, "error");
    }
  };

  // Decline join request (squad leader)
  const declineJoinRequest = async (invitationId: string) => {
    try {
      const response = await invitationService.declineJoinRequest(invitationId);
      if (response.success) {
        showToast("Join request declined", "success");
        // Remove the declined request from the list
        setJoinRequests(prev => prev.filter(req => req._id !== invitationId));
      }
    } catch (error: any) {
      showToast(`❌ ${error.response?.data?.error || "Failed to decline join request"}`, "error");
    }
  };

  // Invite player to squad
  const invitePlayer = async () => {
    if (!squad || !selectedPlayer) return;

    setInviting(true);
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        showToast("User not authenticated", "error");
        return;
      }

      const invitationData = {
        squadId: squad._id,
        invitedUserId: selectedPlayer._id,
        userId: currentUser._id, // Add current user ID for authentication
        message: `You've been invited to join ${squad.name}!`
      };

      // Send invitation
      const inviteResponse = await invitationService.sendInvitation(invitationData);

      if (inviteResponse.success) {
        showToast("Invitation sent successfully!", "success");
        setShowInviteDialog(false);
        setSelectedPlayer(null);
      }
    } catch (error: any) {
      showToast(error.response?.data?.error || "Failed to send invitation", "error");
    } finally {
      setInviting(false);
    }
  };

  // Search for available players
  const searchPlayers = async () => {
    if (!playerSearch.trim()) {
      setAvailablePlayers([]);
      return;
    }

    setPlayersLoading(true);
    try {
      const response = await authService.getAvailablePlayers({ search: playerSearch });

      if (response.success) {
        setAvailablePlayers(response.data);
      }
    } catch (error) {
      console.error("Failed to search players:", error);
      setAvailablePlayers([]);
    } finally {
      setPlayersLoading(false);
    }
  };

  // Load all available players
  const loadAllPlayers = async () => {
    setPlayersLoading(true);
    try {
      const response = await authService.getAvailablePlayers({ limit: 50 });
      if (response.success) {
        setAvailablePlayers(response.data);
      }
    } catch (error) {
      console.error("Failed to load players:", error);
      setAvailablePlayers([]);
    } finally {
      setPlayersLoading(false);
    }
  };

  // Load all available squads for the Find Squad tab
  const loadAllSquads = async () => {
    setSearching(true);
    try {
      const response = await squadService.getSquads({ limit: 50 });

      if (response.success) {
        setSearchResults(response.data);
      }
    } catch (error: any) {
      console.error("Failed to load all squads:", error);
      showToast("Failed to load squads", "error");
    } finally {
      setSearching(false);
    }
  };

  // Filter squads based on search query
  const getFilteredSquads = () => {
    if (!searchQuery.trim()) {
      return searchResults; // Show all squads when no search query
    }

    const query = searchQuery.toLowerCase();
    return searchResults.filter(squad =>
      squad.name?.toLowerCase().includes(query) ||
      squad.leader?.name?.toLowerCase().includes(query) ||
      squad.leader?.pubgId?.toLowerCase().includes(query) ||
      squad.members?.some((member: any) =>
        member.name?.toLowerCase().includes(query) ||
        member.pubgId?.toLowerCase().includes(query)
      )
    );
  };

  // Get filtered squads for display
  const displaySquads = getFilteredSquads();

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      loadSquad();
      loadPendingInvitations();
    }
  }, []);

  // Load join requests when squad is loaded
  useEffect(() => {
    if (squad) {
      loadJoinRequests();
    }
  }, [squad]);

  // Debounced search for players
  useEffect(() => {
    const timer = setTimeout(() => {
      if (playerSearch.trim()) {
        searchPlayers();
      } else {
        setAvailablePlayers([]);
      }
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [playerSearch]);

  // Load all squads when Find Squad tab is opened
  useEffect(() => {
    if (activeTab === "findSquad") {
      loadAllSquads();
    }
  }, [activeTab]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Loading squad...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="sticky top-0 bg-black/95 backdrop-blur-sm border-b border-green-500/20 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-green-400 flex items-center">
            <Users className="w-6 h-6 mr-2" />
            Squad Management
          </h1>
          <Button size="sm" variant="ghost" onClick={onLogout} className="text-red-400">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Pending Squad Invitations */}
        {pendingInvitations.length > 0 && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-400">Pending Invitations</h3>
                    <p className="text-sm text-gray-400">You have {pendingInvitations.length} pending squad invitations</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mt-2">
                {pendingInvitations.map((invitation) => (
                  <div key={invitation._id} className="bg-black/40 rounded p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{invitation.squadName || invitation.squadId?.name}</p>
                      <p className="text-xs text-gray-400">Invited by: {invitation.invitedByName}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        className="bg-green-500 hover:bg-green-600 text-black h-8"
                        onClick={() => acceptInvitation(invitation._id)}
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-500/50 text-red-400 hover:bg-red-500/10 h-8"
                        onClick={() => declineInvitation(invitation._id)}
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Join Requests (for Squad Leader) */}
        {joinRequests.length > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-yellow-400">Join Requests</h3>
                    <p className="text-sm text-gray-400">You have {joinRequests.length} pending join requests</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mt-2">
                {joinRequests.map((request) => (
                  <div key={request._id} className="bg-black/40 rounded p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{request.invitedUserId?.name || 'Unknown User'}</p>
                      <p className="text-xs text-gray-400">PUBG ID: {request.invitedUserId?.pubgId || 'N/A'}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        className="bg-green-500 hover:bg-green-600 text-black h-8"
                        onClick={() => acceptJoinRequest(request._id)}
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-500/50 text-red-400 hover:bg-red-500/10 h-8"
                        onClick={() => declineJoinRequest(request._id)}
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        {!squad ? (
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "mySquad" | "findSquad")} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-900 border-green-500/20">
              <TabsTrigger value="mySquad" className="data-[state=active]:bg-green-500 data-[state=active]:text-black">
                Create Squad
              </TabsTrigger>
              <TabsTrigger value="findSquad" className="data-[state=active]:bg-green-500 data-[state=active]:text-black">
                Find Squad
              </TabsTrigger>
            </TabsList>

            <TabsContent value="mySquad" className="mt-6">
              <Card className="bg-gray-900 border-green-500/20 text-center py-12">
                <CardContent className="space-y-6">
                  <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto">
                    <Users className="w-10 h-10 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">No Squad Found</h3>
                    <p className="text-gray-400 max-w-xs mx-auto">
                      You haven't joined or created a squad yet. Create one to compete in tournaments with your friends!
                    </p>
                  </div>
                  <Button
                    className="bg-green-500 hover:bg-green-600 text-black"
                    onClick={() => setShowCreateSquad(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Squad
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="findSquad" className="mt-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search squads by name, leader, or member..."
                  className="pl-10 bg-gray-900 border-gray-700 text-white"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {searching ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">Searching squads...</p>
                </div>
              ) : displaySquads.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {displaySquads.map((s) => (
                    <Card key={s._id} className="bg-gray-900 border-gray-800 hover:border-green-500/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-bold text-lg text-white">{s.name}</h3>
                            <p className="text-sm text-gray-400 flex items-center mt-1">
                              <Crown className="w-3 h-3 text-yellow-500 mr-1" />
                              Leader: {s.leader?.name || 'Unknown'}
                            </p>
                          </div>
                          <Badge variant="outline" className="bg-gray-800 text-gray-300">
                            {s.members?.length || 0}/{s.maxMembers || 4} Members
                          </Badge>
                        </div>

                        <div className="space-y-3">
                          <div className="flex -space-x-2 overflow-hidden">
                            {s.members?.map((member: any, i: number) => (
                              <div key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-black bg-gray-700 flex items-center justify-center text-xs font-medium text-white" title={member.name}>
                                {member.name?.charAt(0).toUpperCase()}
                              </div>
                            ))}
                          </div>

                          <Button
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                            disabled={s.members?.length >= s.maxMembers}
                            onClick={() => joinSquad(s._id)}
                          >
                            {s.members?.length >= s.maxMembers ? 'Squad Full' : 'Request to Join'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-900 rounded-lg border border-gray-800">
                  <p className="text-gray-400">No squads found matching your search.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-6">
            {/* Squad Details Card */}
            <Card className="bg-gradient-to-br from-gray-900 to-black border-green-500/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-2xl font-bold text-green-400 flex items-center">
                    <Shield className="w-6 h-6 mr-2" />
                    {squad.name}
                  </CardTitle>
                  <p className="text-sm text-gray-400 mt-1">
                    Squad ID: {squad._id}
                  </p>
                </div>
                {squad.leader === getCurrentUser()?._id && (
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="border-red-500/50 text-red-400 hover:bg-red-500/10" onClick={deleteSquad}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Members</p>
                    <p className="text-xl font-bold text-white">{squad.members?.length || 0} / {squad.maxMembers || 4}</p>
                  </div>
                  <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Created</p>
                    <p className="text-xl font-bold text-white">{new Date(squad.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Status</p>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 mt-1">Active</Badge>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Squad Members</h3>
                    {(squad.leader?._id === getCurrentUser()?._id || squad.leader === getCurrentUser()?._id) && squad.members?.length < squad.maxMembers && (
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => {
                          setShowInviteDialog(true);
                          loadAllPlayers();
                        }}
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Invite Player
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {squad.members?.map((member: any) => (
                      <div key={member._id} className="flex items-center justify-between bg-gray-800 p-3 rounded-lg border border-gray-700">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10 border border-gray-600">
                            <AvatarFallback className="bg-gray-700 text-green-400 font-bold">
                              {member.name?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-white flex items-center">
                              {member.name}
                              {(squad.leader?._id === member.userId?._id || squad.leader === member.userId) && (
                                <Crown className="w-3 h-3 text-yellow-500 ml-2" />
                              )}
                            </p>
                            <p className="text-xs text-gray-400">ID: {member.pubgId || 'N/A'}</p>
                          </div>
                        </div>

                        {(member.userId?._id === getCurrentUser()?._id || member.userId === getCurrentUser()?._id) ? (
                          <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-900/20" onClick={leaveSquad}>
                            <LogOut className="w-4 h-4 mr-2" />
                            Leave
                          </Button>
                        ) : (
                          (squad.leader?._id === getCurrentUser()?._id || squad.leader === getCurrentUser()?._id) && (
                            <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-900/20">
                              Kick
                            </Button>
                          )
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Create Squad Dialog */}
      <Dialog open={showCreateSquad} onOpenChange={setShowCreateSquad}>
        <DialogContent className="bg-gray-900 border-green-500/30 text-white">
          <DialogHeader>
            <DialogTitle>Create New Squad</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Squad Name</label>
              <Input
                placeholder="Enter squad name"
                className="bg-black border-gray-700 text-white"
                value={squadName}
                onChange={(e) => setSquadName(e.target.value)}
              />
            </div>
            <Button
              className="w-full bg-green-500 hover:bg-green-600 text-black"
              onClick={createSquad}
              disabled={!squadName.trim()}
            >
              Create Squad
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite Player Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="bg-gray-900 border-green-500/30 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Player to Squad</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search player by name or PUBG ID"
                className="pl-10 bg-black border-gray-700 text-white"
                value={playerSearch}
                onChange={(e) => setPlayerSearch(e.target.value)}
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {playersLoading ? (
                <p className="text-center text-gray-400 py-4">Loading players...</p>
              ) : availablePlayers.length > 0 ? (
                availablePlayers.map((player) => (
                  <div
                    key={player._id}
                    className={`flex items-center justify-between p-3 rounded cursor-pointer transition-colors ${selectedPlayer?._id === player._id ? 'bg-green-500/20 border border-green-500/50' : 'bg-gray-800 hover:bg-gray-700'
                      }`}
                    onClick={() => setSelectedPlayer(player)}
                  >
                    <div>
                      <p className="font-medium text-white">{player.name}</p>
                      <p className="text-xs text-gray-400">ID: {player.pubgId}</p>
                    </div>
                    {selectedPlayer?._id === player._id && (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    )}
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-400 py-4">No players found</p>
              )}
            </div>

            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              onClick={invitePlayer}
              disabled={!selectedPlayer || inviting}
            >
              {inviting ? 'Sending Invitation...' : 'Send Invitation'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
              className={`flex flex-col items-center space-y-1 h-auto py-2 px-3 transition-all duration-200 ${item.screen === "squad"
                ? "text-green-400 bg-green-500/10 shadow-lg shadow-green-500/20"
                : "text-gray-400 hover:text-green-400"
                }`}
              onClick={() => {
                if (item.screen !== "squad") {
                  if (onNavigate) {
                    onNavigate(item.screen as "home" | "squad" | "wallet" | "matches" | "leaderboard" | "live" | "settings");
                  } else {
                    console.log('Navigation function not provided, cannot navigate to:', item.screen);
                    showToast(`Navigation to ${item.screen} not available`, "error");
                  }
                }
              }}
            >
              <item.icon className={`w-5 h-5 ${item.screen === "squad" ? "animate-pulse" : ""}`} />
              <span className="text-xs font-medium">{item.label}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

function CheckCircle({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
