"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Users, Crown, Shield, Plus, LogOut, UserPlus, Search, X, Edit, Trash2, Home, Gamepad2, Trophy, Wallet } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const API_BASE = "http://localhost:5050/api";

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
      console.log('getCurrentUser called:', { userStr, user, userId: user?._id, userIdType: typeof user?._id });
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
        console.log('No current user found, cannot load squad');
        setLoading(false);
        return;
      }
      
      console.log('Loading squad for user:', currentUser._id);
      
      const response = await axios.get(`${API_BASE}/squads/user/${currentUser._id}`);
      console.log('Squad response:', response.data);
      
      if (response.data.success) {
        setSquad(response.data.data);
        console.log('=== SQUAD LOADED ===');
        console.log('Full squad data:', response.data.data);
        console.log('Squad members:', response.data.data.members);
        console.log('Squad leader:', response.data.data.leader);
        console.log('Squad leader type:', typeof response.data.data.leader);
        console.log('Current user ID:', currentUser._id);
        console.log('Current user ID type:', typeof currentUser._id);
        console.log('Leader comparison:', currentUser._id === response.data.data.leader);
        console.log('Leader comparison (strict):', currentUser._id === response.data.data.leader);
        console.log('Leader comparison (loose):', currentUser._id == response.data.data.leader);
        // Initialize edit form
        setEditForm({
          name: response.data.data.name,
          maxMembers: response.data.data.maxMembers
        });
      } else {
        console.log('User not in squad or squad not found');
        if (!keepExistingOnError) {
          setSquad(null);
        }
      }
    } catch (error: any) {
      console.error('Error loading squad:', error);
      console.error('Error response:', error.response?.data);
      // If keepExistingOnError is true, don't clear the squad data
      // This prevents the squad from disappearing due to network issues
      if (!keepExistingOnError) {
        setSquad(null);
      } else {
        console.log('Keeping existing squad data due to error');
      }
    } finally {
      setLoading(false);
    }
  };

  const createSquad = async () => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) return;
      
      const response = await axios.post(`${API_BASE}/squads`, {
        name: squadName,
        leaderId: currentUser._id,
        leaderName: currentUser.name,
        leaderPubgId: currentUser.pubgId
      });
      
      if (response.data.success) {
        setSquad(response.data.data);
        setShowCreateSquad(false);
        setSquadName("");
        showToast("Squad created successfully!", "success");
      }
    } catch (error: any) {
      showToast(error.response?.data?.error || "Failed to create squad", "error");
    }
  };

  const searchSquads = async () => {
    if (!searchQuery.trim()) {
      // If search is cleared, show all squads
      loadAllSquads();
      return;
    }
    
    setSearching(true);
    try {
      const response = await axios.get(`${API_BASE}/squads?search=${encodeURIComponent(searchQuery)}`);
      if (response.data.success) {
        setSearchResults(response.data.data);
      }
    } catch (error: any) {
      showToast("Failed to search squads", "error");
    } finally {
      setSearching(false);
    }
  };

  const joinSquad = async (squadId: string) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) return;
      
      const response = await axios.post(`${API_BASE}/squads/${squadId}/join-request`, {
        userId: currentUser._id,
        userName: currentUser.name,
        userPubgId: currentUser.pubgId
      });
      
      if (response.data.success) {
        showToast(response.data.message || "Join request sent successfully!", "success");
        // Refresh the squad list to show updated status
        loadAllSquads();
      }
    } catch (error: any) {
      showToast(error.response?.data?.error || "Failed to send join request", "error");
    }
  };

  const leaveSquad = async () => {
    if (!squad) return;
    
    if (!confirm("Are you sure you want to leave this squad?")) return;
    
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) return;
      
      if (squad.leader.toString() === currentUser._id) {
        // Leader can't leave, must delete squad
        if (confirm("As the leader, leaving will delete the squad. Continue?")) {
          await axios.delete(`${API_BASE}/squads/${squad._id}`);
          showToast("Squad deleted", "success");
          setSquad(null);
        }
      } else {
        // Regular member can leave using the leave endpoint
        await axios.post(`${API_BASE}/squads/${squad._id}/leave`, {
          userId: currentUser._id
        });
        showToast("Left squad successfully", "success");
        setSquad(null);
      }
    } catch (error: any) {
      showToast(error.response?.data?.error || "Failed to leave squad", "error");
    }
  };

  const updateSquad = async () => {
    if (!squad) return;
    
    try {
      const response = await axios.put(`${API_BASE}/squads/${squad._id}`, editForm);
      if (response.data.success) {
        setSquad(response.data.data);
        setShowEditSquad(false);
        showToast("Squad updated successfully!", "success");
      }
    } catch (error: any) {
      showToast(error.response?.data?.error || "Failed to update squad", "error");
    }
  };

  const removeMember = async (memberId: string) => {
    if (!squad) return;
    
    const currentUser = getCurrentUser();
    if (!currentUser) {
      showToast("User not authenticated", "error");
      return;
    }
    
    console.log('=== REMOVE MEMBER DEBUG ===');
    console.log('Member ID to remove:', memberId);
    console.log('Squad ID:', squad._id);
    console.log('Current user:', currentUser);
    console.log('Squad leader:', squad.leader);
    console.log('Is current user leader?', currentUser._id === squad.leader);
    console.log('Current squad members:', squad.members);
    
    if (!confirm("Are you sure you want to remove this member?")) return;
    
    try {
      console.log('Making DELETE request to:', `${API_BASE}/squads/${squad._id}/members/${memberId}`);
      const response = await axios.delete(`${API_BASE}/squads/${squad._id}/members/${memberId}`, {
        data: { userId: currentUser._id }
      });
      console.log('Remove member response:', response.data);
      
      if (response.data.success) {
        showToast("Member removed successfully", "success");
        
        console.log('Reloading squad data...');
        // Reload the squad data to get the updated member list
        // Use keepExistingOnError=true to prevent squad from disappearing if refresh fails
        await loadSquad(true);
        console.log('Squad data reloaded');
      } else {
        showToast(response.data.error || "Failed to remove member", "error");
      }
    } catch (error: any) {
      console.error('Remove member error:', error);
      console.error('Error response:', error.response?.data);
      showToast(error.response?.data?.error || "Failed to remove member", "error");
    }
  };

  const showToast = (message: string, type: "success" | "error" = "success") => {
    alert(`${type === "success" ? "✅" : "❌"} ${message}`);
  };

  // Load pending invitations
  const loadPendingInvitations = async () => {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    setInvitationsLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/invitations/user/${currentUser._id}`);
      if (response.data?.success) {
        setPendingInvitations(response.data.data);
      }
    } catch (error) {
      console.error("Failed to load invitations:", error);
    } finally {
      setInvitationsLoading(false);
    }
  };

  // Load join requests for squad leaders
  const loadJoinRequests = async () => {
    if (!squad) return;
    
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser._id !== squad.leader) return;
    
    setJoinRequestsLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/invitations/squad/${squad._id}?type=join_request&status=pending`);
      if (response.data?.success) {
        setJoinRequests(response.data.data);
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
      const currentUser = getCurrentUser();
      if (!currentUser) {
        showToast("User not authenticated", "error");
        return;
      }
      
      const response = await axios.post(`${API_BASE}/invitations/${invitationId}/accept`, {
        userId: currentUser._id // Add current user ID for authentication
      });
      if (response.data?.success) {
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
      const currentUser = getCurrentUser();
      if (!currentUser) {
        showToast("User not authenticated", "error");
        return;
      }
      
      const response = await axios.post(`${API_BASE}/invitations/${invitationId}/decline`, {
        userId: currentUser._id // Add current user ID for authentication
      });
      if (response.data?.success) {
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
      const currentUser = getCurrentUser();
      if (!currentUser) {
        showToast("User not authenticated", "error");
        return;
      }
      
      const response = await axios.post(`${API_BASE}/invitations/${invitationId}/accept-join`);
      if (response.data?.success) {
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
      const currentUser = getCurrentUser();
      if (!currentUser) {
        showToast("User not authenticated", "error");
        return;
      }
      
      const response = await axios.post(`${API_BASE}/invitations/${invitationId}/decline-join`);
      if (response.data?.success) {
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
    
    console.log('Inviting player:', { squad, selectedPlayer });
    
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
      
      console.log('Sending invitation with data:', invitationData);
      
      // Send invitation
      const inviteResponse = await axios.post(`${API_BASE}/invitations/send`, invitationData);
      
      console.log('Invitation response:', inviteResponse.data);
      
      if (inviteResponse.data?.success) {
        showToast("Invitation sent successfully!", "success");
        setShowInviteDialog(false);
        setSelectedPlayer(null);
      }
    } catch (error: any) {
      console.error('Invitation error:', error);
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
    
    console.log('Searching for players with query:', playerSearch);
    console.log('Making API call to:', `${API_BASE}/auth/players?search=${encodeURIComponent(playerSearch)}`);
    setPlayersLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/auth/players?search=${encodeURIComponent(playerSearch)}`);
      console.log('Player search response:', response.data);
      
      if (response.data.success) {
        setAvailablePlayers(response.data.data);
        console.log('Available players set:', response.data.data);
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
    console.log('loadAllPlayers called');
    setPlayersLoading(true);
    try {
      console.log('Making API call to:', `${API_BASE}/auth/players?limit=50`);
      const response = await axios.get(`${API_BASE}/auth/players?limit=50`);
      console.log('loadAllPlayers response:', response.data);
      if (response.data?.success) {
        setAvailablePlayers(response.data.data);
        console.log('Available players set:', response.data.data);
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
      console.log('Loading all available squads...');
      const response = await axios.get(`${API_BASE}/squads?limit=50`);
      console.log('All squads response:', response.data);
      
      if (response.data.success) {
        setSearchResults(response.data.data);
        console.log('All squads loaded:', response.data.data.length, 'squads');
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
                    <Users className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-400">Squad Invitations</h3>
                    <p className="text-sm text-blue-300">
                      You have {pendingInvitations.length} pending squad invitation{pendingInvitations.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Invitation list */}
              <div className="space-y-2">
                {pendingInvitations.map((invitation) => (
                  <div key={invitation._id} className="flex items-center justify-between p-3 bg-blue-500/5 rounded border border-blue-500/20">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-blue-300">{invitation.squadName}</h4>
                      <p className="text-xs text-blue-400">Invited by: {invitation.invitedByName}</p>
                      {invitation.message && (
                        <p className="text-xs text-blue-300 mt-1">"{invitation.message}"</p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => acceptInvitation(invitation._id)}
                        className="bg-green-500 hover:bg-green-600 text-white text-xs px-2 py-1"
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => declineInvitation(invitation._id)}
                        className="border-red-500/50 text-red-400 bg-transparent hover:bg-red-500/10 text-xs px-2 py-1"
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
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "mySquad" | "findSquad")} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-900 border-green-500/20">
            <TabsTrigger value="mySquad" className="data-[state=active]:bg-green-500 data-[state=active]:text-black">
              My Squad
            </TabsTrigger>
            <TabsTrigger value="findSquad" className="data-[state=active]:bg-green-500 data-[state=active]:text-black">
              Find Squad
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mySquad" className="space-y-6 mt-4">
            {!squad ? (
              <Card className="bg-gray-900 border-green-500/20">
                <CardHeader>
                  <CardTitle className="text-green-400 text-center">No Squad Found</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <p className="text-gray-400">Create your own squad to start playing together.</p>
                  <Button
                    className="bg-green-500 hover:bg-green-600 text-black"
                    onClick={() => setShowCreateSquad(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Squad
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/30">
                <CardHeader>
                  <CardTitle className="text-green-400 flex items-center justify-between">
                    <span className="flex items-center">
                      <Shield className="w-5 h-5 mr-2" />
                      {squad.name}
                    </span>
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                        <Crown className="w-3 h-3 mr-1" />
                        Rank #{squad.stats?.rank || 'Unranked'}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowEditSquad(true)}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-400">{squad.stats?.matchesWon || 0}</p>
                      <p className="text-sm text-gray-400">Matches Won</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-400">{squad.stats?.totalKills || 0}</p>
                      <p className="text-sm text-gray-400">Total Kills</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {squad.members.map((member: any, index: number) => (
                      <div key={index} className="text-center">
                        <div className="relative">
                          <Avatar className="w-16 h-16 mx-auto mb-2 border-2 border-green-500/30">
                            <AvatarFallback className="bg-gray-800 text-green-400">
                              {(member.name && member.name.length > 0) ? member.name[0] : 
                               (member.userId && member.userId.name && member.userId.name.length > 0) ? member.userId.name[0] :
                               (member.pubgId && member.pubgId.length > 0) ? member.pubgId[0] :
                               (member.userId && member.userId.pubgId && member.userId.pubgId.length > 0) ? member.userId.pubgId[0] : '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-black bg-green-500" />
                          {member.role === 'leader' && (
                            <Crown className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 text-yellow-400" />
                          )}
                          {(() => {
                            const currentUserId = getCurrentUser()?._id;
                            const squadLeaderId = squad.leader;
                            const isCurrentUserLeader = currentUserId === squadLeaderId;
                            const isNotLeader = member.role !== 'leader';
                            
                            console.log('Member removal button debug:', {
                              memberName: member.name || member.userId?.name,
                              memberRole: member.role,
                              currentUserId: currentUserId,
                              squadLeaderId: squadLeaderId,
                              currentUserIdType: typeof currentUserId,
                              squadLeaderIdType: typeof squadLeaderId,
                              isCurrentUserLeader,
                              isNotLeader,
                              shouldShowButton: isCurrentUserLeader && isNotLeader
                            });
                            
                            return isCurrentUserLeader && isNotLeader ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="absolute -top-2 -right-2 w-6 h-6 p-0 bg-red-500 hover:bg-red-600 text-white"
                                onClick={() => removeMember(member.userId._id || member.userId)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            ) : null;
                          })()}
                        </div>
                        <p className="text-sm font-medium">{member.name || (member.userId && member.userId.name) || 'Unknown Player'}</p>
                        <p className="text-xs text-green-400">{member.pubgId || (member.userId && member.userId.pubgId) || 'No PUBG ID'}</p>
                        <Badge className="text-xs mt-1" variant={member.role === 'leader' ? 'default' : 'secondary'}>
                          {member.role}
                        </Badge>
                      </div>
                    ))}
                    
                    {Array.from({ length: squad.maxMembers - squad.members.length }).map((_, index) => (
                      <div key={`empty-${index}`} className="text-center">
                        <div className="w-16 h-16 mx-auto mb-2 border-2 border-dashed border-gray-600 rounded-full flex items-center justify-center">
                          <Plus className="w-6 h-6 text-gray-600" />
                        </div>
                        <p className="text-sm text-gray-500">Empty Slot</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      className="border-red-500/50 text-red-400 bg-transparent hover:bg-red-500/10"
                      onClick={leaveSquad}
                    >
                      Leave Squad
                    </Button>
                    <Button
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                      onClick={() => {
                        console.log('Invite Player button clicked');
                        console.log('Current squad:', squad);
                        setShowInviteDialog(true);
                        console.log('Loading all players...');
                        loadAllPlayers(); // Load all players when dialog opens
                      }}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Invite Player
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="findSquad" className="space-y-6 mt-4">
            <Card className="bg-gray-900 border-green-500/20">
              <CardHeader>
                <CardTitle className="text-green-400 flex items-center justify-between">
                  <span>Available Squads to Join</span>
                  <Button
                    size="sm"
                    onClick={loadAllSquads}
                    disabled={searching}
                    className="bg-green-500 hover:bg-green-600 text-black"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    {searching ? 'Loading...' : 'Refresh'}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Search squads by name, member, or PUBG ID..."
                    className="bg-black border-gray-700 text-white flex-1"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchSquads()}
                  />
                  <Button
                    onClick={searchSquads}
                    disabled={!searchQuery.trim() || searching}
                    className="bg-green-500 hover:bg-green-600 text-black"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    {searching ? 'Searching...' : 'Search'}
                  </Button>
                </div>

                {/* Show all squads by default */}
                {displaySquads.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-400">
                        {searchQuery.trim() ? 'Search Results' : 'All Available Squads'}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {displaySquads.length} squad{displaySquads.length !== 1 ? 's' : ''}
                        {searchQuery.trim() && displaySquads.length !== searchResults.length && (
                          <span className="text-gray-600"> of {searchResults.length}</span>
                        )}
                      </span>
                    </div>
                    
                    {displaySquads.map((squad) => (
                      <Card key={squad._id} className="bg-gray-800 border-gray-700 hover:border-green-500/30 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h4 className="font-medium text-green-400 text-lg">{squad.name}</h4>
                                <Badge variant={squad.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                                  {squad.status}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-gray-400">
                                    <Users className="w-4 h-4 inline mr-1" />
                                    {squad.members?.length || 0}/{squad.maxMembers || 4} members
                                  </p>
                                  <p className="text-gray-500 text-xs">
                                    {squad.maxMembers - (squad.members?.length || 0)} slot{squad.maxMembers - (squad.members?.length || 0) !== 1 ? 's' : ''} available
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-400">
                                    <Crown className="w-4 h-4 inline mr-1" />
                                    Leader: {squad.leader?.name || 'Unknown'}
                                  </p>
                                  <p className="text-gray-500 text-xs">
                                    {squad.leader?.pubgId || 'No PUBG ID'}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col space-y-2 ml-4">
                              <Button
                                size="sm"
                                onClick={() => joinSquad(squad._id)}
                                className="bg-blue-500 hover:bg-blue-600 text-white"
                                disabled={!squad.leader || squad.status !== 'active'}
                              >
                                Request to Join
                              </Button>
                              {squad.status !== 'active' && (
                                <p className="text-xs text-red-400 text-center">Squad Inactive</p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Show message when no squads found */}
                {displaySquads.length === 0 && !searching && (
                  <div className="text-center text-gray-400 py-8">
                    {searchQuery.trim() ? (
                      <>
                        <p>No squads found matching "{searchQuery}"</p>
                        <p className="text-sm mt-2">Try a different search term or check all available squads</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={loadAllSquads}
                          className="mt-3"
                        >
                          Show All Squads
                        </Button>
                      </>
                    ) : (
                      <>
                        <p>No squads available at the moment</p>
                        <p className="text-sm mt-2">Check back later or create your own squad</p>
                      </>
                    )}
                  </div>
                )}

                {/* Loading state */}
                {searching && (
                  <div className="text-center text-gray-400 py-8">
                    <p>Loading squads...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Squad Dialog */}
      <Dialog open={showCreateSquad} onOpenChange={setShowCreateSquad}>
        <DialogContent className="bg-gray-900 border-green-500/30">
          <DialogHeader>
            <DialogTitle className="text-green-400">Create New Squad</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Squad name..."
              className="bg-black border-gray-700 text-white"
              value={squadName}
              onChange={(e) => setSquadName(e.target.value)}
            />
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setShowCreateSquad(false)}>
                Cancel
              </Button>
              <Button onClick={createSquad} disabled={!squadName.trim()}>
                Create Squad
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Squad Dialog */}
      <Dialog open={showEditSquad} onOpenChange={setShowEditSquad}>
        <DialogContent className="bg-gray-900 border-green-500/30">
          <DialogHeader>
            <DialogTitle className="text-green-400">Edit Squad</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Squad name..."
              className="bg-black border-gray-700 text-white"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            />
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setShowEditSquad(false)}>
                Cancel
              </Button>
              <Button onClick={updateSquad} disabled={!editForm.name.trim()}>
                Update Squad
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite Player Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={(open) => {
        console.log('Invite dialog open state changed:', open);
        setShowInviteDialog(open);
        if (!open) {
          setSelectedPlayer(null);
          setPlayerSearch("");
          setAvailablePlayers([]);
        }
      }}>
        <DialogContent className="bg-gray-900 border-green-500/30">
          <DialogHeader>
            <DialogTitle className="text-green-400">Invite Player to Squad</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  placeholder="Search for players by name, email, or PUBG ID..."
                  className="bg-black border-gray-700 text-white flex-1"
                  value={playerSearch}
                  onChange={(e) => setPlayerSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchPlayers()}
                />
                <Button 
                  onClick={() => {
                    console.log('Search button clicked, playerSearch:', playerSearch);
                    searchPlayers();
                  }} 
                  disabled={!playerSearch.trim() || playersLoading}
                  size="sm"
                >
                  {playersLoading ? 'Searching...' : 'Search'}
                </Button>
              </div>
              
              {selectedPlayer && (
                <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Avatar className="w-8 h-8 mr-2">
                        <AvatarFallback className="bg-green-800 text-green-400">
                          {selectedPlayer.name && selectedPlayer.name.length > 0 ? selectedPlayer.name[0] : selectedPlayer.pubgId ? selectedPlayer.pubgId[0] : '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-green-400">{selectedPlayer.name || 'Unknown Player'}</p>
                        <p className="text-xs text-green-300">{selectedPlayer.pubgId || 'No PUBG ID'}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedPlayer(null)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
              
              {!selectedPlayer && (
                <>
                  {playersLoading ? (
                    <div className="text-center py-4">
                      <p className="text-gray-400">Searching for players...</p>
                    </div>
                  ) : availablePlayers.length === 0 && playerSearch.trim() ? (
                    <div className="text-center py-4 text-gray-400">
                      <p>No players found matching "{playerSearch}"</p>
                      <p className="text-sm">Try a different search term</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={loadAllPlayers}
                        className="mt-2"
                      >
                        Show All Players
                      </Button>
                    </div>
                  ) : availablePlayers.length > 0 ? (
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {availablePlayers.map((player) => (
                        <div
                          key={player._id}
                          className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
                            selectedPlayer?._id === player._id 
                              ? 'bg-green-500/20 border border-green-500/30' 
                              : 'hover:bg-gray-800'
                          }`}
                          onClick={() => {
                            console.log('Player selected:', player);
                            setSelectedPlayer(player);
                          }}
                        >
                          <div className="flex items-center">
                            <Avatar className="w-8 h-8 mr-2">
                              <AvatarFallback className="bg-gray-800 text-gray-400">
                                {player.name && player.name.length > 0 ? player.name[0] : player.pubgId ? player.pubgId[0] : '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm text-gray-300">{player.name || 'Unknown Player'}</p>
                              <p className="text-xs text-gray-400">{player.email || 'No email'}</p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {player.pubgId}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-400">
                      <p>Search for players to invite</p>
                      <p className="text-sm">Enter a name, email, or PUBG ID</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={loadAllPlayers}
                        className="mt-2"
                      >
                        Show All Players
                      </Button>
                    </div>
                  )}
                </>
              )}
              
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => {
                  setShowInviteDialog(false);
                  setSelectedPlayer(null);
                  setPlayerSearch("");
                  setAvailablePlayers([]);
                }}>
                  Cancel
                </Button>
                <Button onClick={invitePlayer} disabled={!selectedPlayer || inviting}>
                  {inviting ? 'Inviting...' : 'Send Invite'}
                </Button>
              </div>
            </div>
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
          ].map((item) => (
            <Button
              key={item.screen}
              variant="ghost"
              size="sm"
              className={`flex flex-col items-center space-y-1 h-auto py-2 px-3 transition-all duration-200 ${
                item.screen === "squad"
                  ? "text-green-400 bg-green-500/10 shadow-lg shadow-green-500/20"
                  : "text-gray-400 hover:text-green-400"
              }`}
              onClick={() => {
                if (item.screen !== "squad") {
                  // Navigate to other screens using proper app navigation
                  if (onNavigate) {
                    onNavigate(item.screen as "home" | "wallet" | "matches" | "leaderboard" | "live" | "settings");
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
