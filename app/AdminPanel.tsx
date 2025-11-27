"use client";

import React, { useMemo, useState, useEffect } from "react";
import axios from "axios";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle, Ban, Calendar, Eye, Shield, Trophy, Zap, LogOut, Loader2, RefreshCcw, X, Search, CheckCircle, Filter, Trash2, Users,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// ❗️Use axios directly — no custom instance
// Set your API base here. If your backend runs on 5050, use that:
const API_BASE = "http://localhost:5050/api";
// If your API is on the same origin (Next.js API routes), you can do:
// const API_BASE = "/api";

// Types
type MapName = "Erangel" | "Livik" | "Sanhok" | "Miramar" | "Vikendi";

type RankRewardItem = {
  rank: "1st Place" | "2nd Place" | "3rd Place" | "4th Place" | "5th Place";
  amount: number;
};

type PrizeDistribution = {
  rankRewards: { total: number; ranks: RankRewardItem[] };
  killRewards: { total: number; perKill: number; maxKills: number };
  customRewards: { name: string; amount: number }[];
  summary: { totalDistributed: number; rankRewardsTotal: number; killRewardsTotal: number; customRewardsTotal: number };
};

function summarizePrize(pd: Omit<PrizeDistribution, "summary">): PrizeDistribution {
  const rankRewardsTotal = pd.rankRewards.ranks.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const customRewardsTotal = pd.customRewards.reduce((s, c) => s + (Number(c.amount) || 0), 0);
  const killRewardsTotal = Number(pd.killRewards.total) || 0;
  const totalDistributed = rankRewardsTotal + customRewardsTotal + killRewardsTotal;
  return {
    ...pd,
    rankRewards: { ...pd.rankRewards, total: rankRewardsTotal },
    summary: {
      totalDistributed,
      rankRewardsTotal,
      killRewardsTotal,
      customRewardsTotal,
    },
  };
}

export default function AdminPanel({ onSwitchToUser }: { onSwitchToUser?: () => void }) {
  const [activeAdminTab, setActiveAdminTab] = useState<"create" | "manage" | "results" | "users" | "squads">("create");

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

  // Manage tab state
  const [manageLoading, setManageLoading] = useState(false);
  const [manageErr, setManageErr] = useState<string | null>(null);
  const [manageRows, setManageRows] = useState<any[]>([]);
  const [selectedMatchForDetails, setSelectedMatchForDetails] = useState<any>(null);
  const [matchDetailsLoading, setMatchDetailsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Results tab state
  const [resultsLoading, setResultsLoading] = useState(false);
  const [completedMatches, setCompletedMatches] = useState<any[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [uploadingResults, setUploadingResults] = useState(false);
  const [matchParticipants, setMatchParticipants] = useState<any[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
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
    specialAwards: [
      { name: "Most Damage Dealt", recipient: "", amount: 0 },
      { name: "Longest Survival", recipient: "", amount: 0 },
    ],
    notes: "",
  });

  // Users tab state
  const [usersLoading, setUsersLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState("all");
  const [userPagination, setUserPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userActionLoading, setUserActionLoading] = useState(false);
  
  // Bulk operations state
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [showBulkBanDialog, setShowBulkBanDialog] = useState(false);
  const [bulkBanForm, setBulkBanForm] = useState({
    reason: '',
    duration: 'permanent',
    adminNotes: ''
  });

  // Squads tab state
  const [squadsLoading, setSquadsLoading] = useState(false);
  const [squads, setSquads] = useState<any[]>([]);
  const [squadsError, setSquadsError] = useState<string | null>(null);
  const [squadSearch, setSquadSearch] = useState("");
  const [squadStatusFilter, setSquadStatusFilter] = useState("all");
  const [squadPagination, setSquadPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [selectedSquad, setSelectedSquad] = useState<any>(null);
  const [squadActionLoading, setSquadActionLoading] = useState(false);
  const [showSquadDetails, setShowSquadDetails] = useState(false);
  const [showEditSquad, setShowEditSquad] = useState(false);
  const [editSquadForm, setEditSquadForm] = useState({
    name: '',
    maxMembers: 4,
    status: 'active'
  });

  const loadMatches = async () => {
    setManageLoading(true);
    setManageErr(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/matches/management`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data?.success) {
        setManageRows(response.data.data);
      } else {
        setManageErr("Failed to load matches");
      }
    } catch (error: any) {
      setManageErr(error?.response?.data?.error || error?.message || "Failed to load matches");
    } finally {
      setManageLoading(false);
    }
  };

  // Cancel a match
  const cancelMatch = async (matchId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE}/matches/${matchId}/cancel`, { 
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data?.success) {
        showToast("Match cancelled successfully!", "success");
        loadMatches(); // Refresh the list
      } else {
        showToast("Failed to cancel match", "error");
      }
    } catch (error: any) {
      showToast(error?.response?.data?.error || "Failed to cancel match", "error");
    }
  };

  // Delete a match
  const deleteMatch = async (matchId: string) => {
    if (!confirm("Are you sure you want to delete this match? This action cannot be undone.")) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API_BASE}/matches/${matchId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data?.success) {
        showToast("Match deleted successfully!", "success");
        loadMatches(); // Refresh the list
      } else {
        showToast("Failed to delete match", "error");
      }
    } catch (error: any) {
      showToast(error?.response?.data?.error || "Failed to delete match", "error");
    }
  };

  // Load match details
  const loadMatchDetails = async (matchId: string) => {
    setMatchDetailsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/matches/${matchId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data?.success) {
        setSelectedMatchForDetails(response.data.data);
      } else {
        setMsg("Failed to load match details");
      }
    } catch (error: any) {
      setMsg(error?.response?.data?.error || "Failed to load match details");
    } finally {
      setMatchDetailsLoading(false);
    }
  };

  // Load completed matches for results
  const loadCompletedMatches = async () => {
    setResultsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/matches/completed`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data?.success) {
        setCompletedMatches(response.data.data);
      }
    } catch (error: any) {
      console.error("Failed to load completed matches:", error);
    } finally {
      setResultsLoading(false);
    }
  };

  // Auto-update match statuses
  const handleAutoUpdateStatuses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE}/matches/auto-update-statuses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data?.success) {
        showToast(`Statuses updated: ${response.data.data.started} started, ${response.data.data.completed} completed`, "success");
        // Refresh the matches list
        loadCompletedMatches();
      }
    } catch (error: any) {
      showToast(error?.response?.data?.error || "Failed to update match statuses", "error");
    }
  };



  // Load match participants
  const loadMatchParticipants = async (matchId: string) => {
    setParticipantsLoading(true);
    try {
      // TODO: Replace this with actual API call when backend supports match participants
      // For now, we'll use an empty array and show a message
      setMatchParticipants([]);
      
      // Real implementation would be:
      // const token = localStorage.getItem('token');
      // const response = await axios.get(`${API_BASE}/matches/${matchId}/participants`, {
      //   headers: { Authorization: `Bearer ${token}` }
      // });
      // if (response.data?.success) {
      //   setMatchParticipants(response.data.data);
      // }
      
      console.log(`No participants API available yet for match ${matchId}`);
      
    } catch (error: any) {
      console.error("Failed to load match participants:", error);
      setMatchParticipants([]);
    } finally {
      setParticipantsLoading(false);
    }
  };

  // Handle match selection for results
  const handleMatchSelection = (matchId: string) => {
    const match = completedMatches.find(m => m._id === matchId);
    setSelectedMatch(match);
    
    // Clear previous form data when selecting a new match
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
    
    // Load participants for the selected match
    if (match) {
      loadMatchParticipants(matchId);
      
      // Pre-fill special awards based on match configuration
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

  // Upload match results
  const handleUploadResults = async () => {
    if (!selectedMatch) {
      showToast("Please select a match first", "error");
      return;
    }

    // Validate form
    if (resultsForm.totalParticipants === 0) {
      showToast("Please enter total participants", "error");
      return;
    }

    if (resultsForm.matchDuration === 0) {
      showToast("Please enter match duration", "error");
      return;
    }

    // Validate squad rankings
    const validRankings = resultsForm.squadRankings.filter(
      squad => squad.squadName !== "" && squad.squadName.trim() !== "" && squad.kills >= 0
    );

    if (validRankings.length === 0) {
      showToast("Please enter at least one squad ranking", "error");
      return;
    }

    setUploadingResults(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE}/matches/${selectedMatch._id}/results`, {
        matchId: selectedMatch._id,
        results: {
          ...resultsForm,
          squadRankings: validRankings,
        },
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data?.success) {
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
                specialAwards: [
        { name: "Most Damage Dealt", recipient: "", amount: 0 },
        { name: "Longest Survival", recipient: "", amount: 0 },
      ],
          notes: "",
        });
        loadCompletedMatches(); // Refresh the list
      }
    } catch (error: any) {
      showToast(error?.response?.data?.error || "Failed to upload results", "error");
    } finally {
      setUploadingResults(false);
    }
  };

  // Load completed matches when results tab is active
  useEffect(() => {
    if (activeAdminTab === "results") {
      loadCompletedMatches();
    }
  }, [activeAdminTab]);

  // Load matches when manage tab is active
  useEffect(() => {
    if (activeAdminTab === "manage") {
      loadMatches();
    }
  }, [activeAdminTab]);

  // Load users when users tab is active
  useEffect(() => {
    if (activeAdminTab === "users") {
      loadUsers();
    }
  }, [activeAdminTab]);

  // Load squads when squads tab is active
  useEffect(() => {
    if (activeAdminTab === "squads") {
      loadSquads();
    }
  }, [activeAdminTab]);

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

      // ✅ axios used directly here
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE}/matches`,
        {
          name: form.name,
          entryFee: form.entryFee,
          prizePool: form.prizePool,
          maxPlayers: form.maxPlayers,
          map: form.map,
          startTime: startISO,
          prizeDistribution: computed.pd,
        },
        {
          // set to true only if you actually use cookies/sessions and enabled CORS creds on server
          withCredentials: false,
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        }
      );

      showToast("Match created successfully!", "success");
      setActiveAdminTab("manage");
    } catch (e: any) {
      showToast(e?.response?.data?.error || e?.message || "Failed to create match", "error");
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = () => {
    // Clear all cookies
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    // Clear all local storage
    localStorage.clear();
    
    // Clear session storage
    sessionStorage.clear();
    
    // Reload the page to reset the app state
    window.location.reload();
  };

  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    // Auto-hide toast after 3 seconds
    setTimeout(() => setToast(null), 3000);
  };

  // Load users with pagination and filtering
  const loadUsers = async (page = 1, search = userSearch, status = userStatusFilter) => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: userPagination.limit.toString(),
        ...(search && { search }),
        ...(status !== 'all' && { status })
      });

      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data?.success) {
        setUsers(response.data.data);
        setUserPagination(response.data.pagination);
        setUsersError(null);
      } else {
        setUsersError("Failed to load users");
      }
    } catch (error: any) {
      setUsersError(error?.response?.data?.error || "Failed to load users");
    } finally {
      setUsersLoading(false);
    }
  };

  // Update user status
  const updateUserStatus = async (userId: string, status: string, reason: string, adminNotes: string) => {
    setUserActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`${API_BASE}/admin/users/${userId}/status`, {
        status,
        reason,
        adminNotes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data?.success) {
        showToast(`User status updated to ${status}`, "success");
        loadUsers(userPagination.page, userSearch, userStatusFilter);
        setSelectedUser(null);
      } else {
        showToast("Failed to update user status", "error");
      }
    } catch (error: any) {
      showToast(error?.response?.data?.error || "Failed to update user status", "error");
    } finally {
      setUserActionLoading(false);
    }
  };

  // Ban user
  const banUser = async (userId: string, reason: string, duration: string, adminNotes: string) => {
    setUserActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE}/admin/users/${userId}/ban`, {
        reason,
        duration,
        adminNotes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data?.success) {
        showToast("User banned successfully", "success");
        loadUsers(userPagination.page, userSearch, userStatusFilter);
        setSelectedUser(null);
      } else {
        showToast("Failed to ban user", "error");
      }
    } catch (error: any) {
      showToast(error?.response?.data?.error || "Failed to ban user", "error");
    } finally {
      setUserActionLoading(false);
    }
  };

  // Unban user
  const unbanUser = async (userId: string, adminNotes: string) => {
    setUserActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE}/admin/users/${userId}/unban`, {
        adminNotes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data?.success) {
        showToast("User unbanned successfully", "success");
        loadUsers(userPagination.page, userSearch, userStatusFilter);
        setSelectedUser(null);
      } else {
        showToast("Failed to unban user", "error");
      }
    } catch (error: any) {
      showToast(error?.response?.data?.error || "Failed to unban user", "error");
    } finally {
      setUserActionLoading(false);
    }
  };

  // Get user details
  const loadUserDetails = async (userId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data?.success) {
        setSelectedUser(response.data.data);
      } else {
        showToast("Failed to load user details", "error");
      }
    } catch (error: any) {
      showToast(error?.response?.data?.error || "Failed to load user details", "error");
    }
  };

  // Bulk ban users
  const bulkBanUsers = async () => {
    if (selectedUsers.length === 0) {
      showToast("No users selected for banning", "error");
      return;
    }

    if (!bulkBanForm.reason.trim()) {
      showToast("Ban reason is required", "error");
      return;
    }

    setBulkActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const promises = selectedUsers.map(userId => 
        axios.post(`${API_BASE}/admin/users/${userId}/ban`, {
          reason: bulkBanForm.reason,
          duration: bulkBanForm.duration,
          adminNotes: bulkBanForm.adminNotes
        }, {
          headers: { Authorization: `Bearer ${token}` }
        })
      );

      const results = await Promise.allSettled(promises);
      const successful = results.filter(result => 
        result.status === 'fulfilled' && result.value.data?.success
      ).length;
      const failed = results.length - successful;

      if (successful > 0) {
        showToast(`Successfully banned ${successful} users${failed > 0 ? `, ${failed} failed` : ''}`, "success");
        setSelectedUsers([]);
        setShowBulkBanDialog(false);
        setBulkBanForm({ reason: '', duration: 'permanent', adminNotes: '' });
        loadUsers(userPagination.page, userSearch, userStatusFilter);
      } else {
        showToast("Failed to ban any users", "error");
      }
    } catch (error: any) {
      showToast(error?.response?.data?.error || "Failed to perform bulk ban operation", "error");
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Handle user selection for bulk operations
  const handleUserSelection = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  // Handle select all users
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(users.map(user => user._id));
    } else {
      setSelectedUsers([]);
    }
  };

  // Ban user by PUBG ID
  const banUserByPubgId = async (pubgId: string, reason: string, duration: string, adminNotes: string) => {
    setBulkActionLoading(true);
    try {
      // Find user by PUBG ID
      const user = users.find(u => u.pubgId === pubgId);
      if (!user) {
        showToast(`User with PUBG ID "${pubgId}" not found`, "error");
        return;
      }

      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE}/admin/users/${user._id}/ban`, {
        reason,
        duration,
        adminNotes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data?.success) {
        showToast(`User ${pubgId} banned successfully`, "success");
        loadUsers(userPagination.page, userSearch, userStatusFilter);
      } else {
        showToast("Failed to ban user", "error");
      }
    } catch (error: any) {
      showToast(error?.response?.data?.error || "Failed to ban user", "error");
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Squad Management Functions
  const loadSquads = async (page = 1, search = squadSearch, status = squadStatusFilter) => {
    setSquadsLoading(true);
    setSquadsError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: squadPagination.limit.toString()
      });
      
      if (search) params.append('search', search);
      if (status && status !== 'all') params.append('status', status);
      
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/squads?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data?.success) {
        setSquads(response.data.data);
        setSquadPagination(response.data.pagination);
      } else {
        setSquadsError("Failed to load squads");
      }
    } catch (error: any) {
      setSquadsError(error?.response?.data?.error || error?.message || "Failed to load squads");
    } finally {
      setSquadsLoading(false);
    }
  };

  const loadSquadDetails = async (squadId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/squads/${squadId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data?.success) {
        setSelectedSquad(response.data.data);
        setEditSquadForm({
          name: response.data.data.name,
          maxMembers: response.data.data.maxMembers,
          status: response.data.data.status
        });
        setShowSquadDetails(true);
      } else {
        showToast("Failed to load squad details", "error");
      }
    } catch (error: any) {
      showToast(error?.response?.data?.error || "Failed to load squad details", "error");
    }
  };

  const updateSquad = async () => {
    if (!selectedSquad) return;
    
    setSquadActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_BASE}/squads/${selectedSquad._id}`, editSquadForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data?.success) {
        showToast("Squad updated successfully", "success");
        setShowEditSquad(false);
        loadSquads(squadPagination.page, squadSearch, squadStatusFilter);
        setSelectedSquad(response.data.data);
      } else {
        showToast("Failed to update squad", "error");
      }
    } catch (error: any) {
      showToast(error?.response?.data?.error || "Failed to update squad", "error");
    } finally {
      setSquadActionLoading(false);
    }
  };

  const deleteSquad = async (squadId: string) => {
    if (!confirm("Are you sure you want to delete this squad? This action cannot be undone.")) {
      return;
    }
    
    setSquadActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API_BASE}/squads/${squadId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data?.success) {
        showToast("Squad deleted successfully", "success");
        loadSquads(squadPagination.page, squadSearch, squadStatusFilter);
        setSelectedSquad(null);
        setShowSquadDetails(false);
      } else {
        showToast("Failed to delete squad", "error");
      }
    } catch (error: any) {
      showToast(error?.response?.data?.error || "Failed to delete squad", "error");
    } finally {
      setSquadActionLoading(false);
    }
  };

  const removeMemberFromSquad = async (squadId: string, userId: string) => {
    if (!confirm("Are you sure you want to remove this member from the squad?")) {
      return;
    }
    
    setSquadActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API_BASE}/squads/${squadId}/members/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data?.success) {
        showToast("Member removed successfully", "success");
        loadSquadDetails(squadId);
        loadSquads(squadPagination.page, squadSearch, squadStatusFilter);
      } else {
        showToast("Failed to remove member", "error");
      }
    } catch (error: any) {
      showToast(error?.response?.data?.error || "Failed to remove member", "error");
    } finally {
      setSquadActionLoading(false);
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

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 bg-black/95 backdrop-blur-sm border-b border-red-500/20 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-red-400 flex items-center">
            <Shield className="w-6 h-6 mr-2" />
            Admin Panel
          </h1>
          <div className="flex items-center space-x-2">
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Super Admin</Badge>
            <Button
              size="sm"
              variant="ghost"
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4">
        <Tabs value={activeAdminTab} onValueChange={(v: any) => setActiveAdminTab(v)} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-900 border border-red-500/20">
            <TabsTrigger value="create" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
              Create
            </TabsTrigger>
            <TabsTrigger value="manage" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
              Manage
            </TabsTrigger>
            <TabsTrigger value="results" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
              Results
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
              Users
            </TabsTrigger>
            <TabsTrigger value="squads" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
              Squads
            </TabsTrigger>
          </TabsList>

          {/* CREATE */}
          <TabsContent value="create" className="space-y-6 mt-4">
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
                    className={`text-sm p-2 rounded ${
                      msg.toLowerCase().includes("success")
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
          </TabsContent>

          {/* MANAGE / RESULTS / USERS placeholders unchanged */}
          <TabsContent value="manage" className="space-y-4 mt-4">
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
      {/* Loading skeleton */}
      {manageLoading && (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="animate-pulse flex items-center justify-between p-3 bg-gray-800 rounded-lg">
              <div className="space-y-2">
                <div className="h-4 w-40 bg-gray-700 rounded" />
                <div className="flex gap-3">
                  <div className="h-3 w-20 bg-gray-700 rounded" />
                  <div className="h-3 w-12 bg-gray-700 rounded" />
                  <div className="h-5 w-16 bg-gray-700 rounded" />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="h-8 w-8 bg-gray-700 rounded" />
                <div className="h-8 w-8 bg-gray-700 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!manageLoading && manageRows.length === 0 && (
        <div className="p-6 text-center text-gray-400 bg-gray-800 rounded-lg">
          No matches found. Create one in the Create tab.
        </div>
      )}

      {/* Rows */}
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
                  className={`${
                    match.status === "live"
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
</TabsContent>


          <TabsContent value="results" className="space-y-4 mt-4">
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

                    {/* Prize Distribution Info */}
                    <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <h4 className="font-semibold text-green-400 mb-2">Auto Prize Distribution</h4>
                      <p className="text-sm text-gray-300">
                        System will automatically distribute rank & kill rewards based on configured rules.
                        Total prize pool: ₹{selectedMatch.prizePool.toLocaleString()}
                      </p>
                      <div className="mt-2 p-2 bg-green-500/20 rounded border border-green-500/30">
                        <p className="text-xs text-green-300 font-medium">🎯 Participant Selection</p>
                        <p className="text-xs text-green-200">
                          All player names are automatically restricted to only those who actually joined this match.
                          This ensures accurate results and prevents invalid entries.
                        </p>
                      </div>
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
          </TabsContent>

          <TabsContent value="users" className="space-y-4 mt-4">
  {/* Enhanced User Management with Ban Access Controls */}
  <Card className="bg-gray-900 border-red-500/20">
    <CardHeader>
      <CardTitle className="text-red-400 flex items-center justify-between">
        User Management & Ban Controls
        <div className="flex space-x-2">
          <Button size="sm" variant="ghost">
            <Search className="w-4 h-4 text-gray-400" />
          </Button>
          <Button size="sm" variant="ghost">
            <Filter className="w-4 h-4 text-gray-400" />
          </Button>
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
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
          placeholder="Search by PUBG ID, Name, or Email..."
          className="bg-black border-gray-700 text-white flex-1"
          value={userSearch}
          onChange={(e) => setUserSearch(e.target.value)}
        />
        <Select value={userStatusFilter} onValueChange={(value) => setUserStatusFilter(value)}>
          <SelectTrigger className="bg-black border-gray-700 text-white w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="banned">Banned</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
        <Button
          size="sm"
          variant="outline"
          className="border-blue-500/50 text-blue-400 bg-transparent"
          onClick={() => loadUsers(1, userSearch, userStatusFilter)}
          disabled={usersLoading}
        >
          {usersLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
          Search
        </Button>
      </div>

      {/* Bulk Operations Controls */}
      {selectedUsers.length > 0 && (
        <Card className="bg-red-500/10 border-red-500/30 mb-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                  {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
                </Badge>
                <span className="text-sm text-gray-400">
                  Ready for bulk operations
                </span>
              </div>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-gray-500/50 text-gray-400 bg-transparent"
                  onClick={() => setSelectedUsers([])}
                >
                  Clear Selection
                </Button>
                <Button
                  size="sm"
                  className="bg-red-500 hover:bg-red-600 text-white"
                  onClick={() => setShowBulkBanDialog(true)}
                  disabled={bulkActionLoading}
                >
                  <Ban className="w-4 h-4 mr-2" />
                  Ban Selected ({selectedUsers.length})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ban by PUBG ID Section */}
      <Card className="bg-gray-800 border-orange-500/20 mb-4">
        <CardHeader>
          <CardTitle className="text-orange-400 flex items-center">
            <Ban className="w-5 h-5 mr-2" />
            Ban User by PUBG ID
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1">
              <label className="text-sm text-gray-400 mb-2 block">PUBG ID</label>
              <Input
                placeholder="Enter PUBG ID..."
                className="bg-black border-gray-700 text-white"
                id="pubgIdInput"
              />
            </div>
            <div className="md:col-span-1">
              <label className="text-sm text-gray-400 mb-2 block">Ban Reason</label>
              <Input
                placeholder="Enter ban reason..."
                className="bg-black border-gray-700 text-white"
                id="banReasonInput"
              />
            </div>
            <div className="md:col-span-1">
              <label className="text-sm text-gray-400 mb-2 block">Duration</label>
              <Select value={bulkBanForm.duration} onValueChange={(value) => setBulkBanForm({ ...bulkBanForm, duration: value })}>
                <SelectTrigger className="bg-black border-gray-700 text-white">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="permanent">Permanent</SelectItem>
                  <SelectItem value="7">7 Days</SelectItem>
                  <SelectItem value="30">30 Days</SelectItem>
                  <SelectItem value="90">90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-1 flex items-end">
              <Button
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                onClick={() => {
                  const pubgId = (document.getElementById('pubgIdInput') as HTMLInputElement)?.value;
                  const reason = (document.getElementById('banReasonInput') as HTMLInputElement)?.value;
                  
                  if (!pubgId || !reason) {
                    showToast("PUBG ID and ban reason are required", "error");
                    return;
                  }
                  
                  banUserByPubgId(pubgId, reason, bulkBanForm.duration, '');
                  
                  // Clear inputs
                  (document.getElementById('pubgIdInput') as HTMLInputElement).value = '';
                  (document.getElementById('banReasonInput') as HTMLInputElement).value = '';
                }}
                disabled={bulkActionLoading}
              >
                {bulkActionLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Ban className="w-4 h-4 mr-2" />
                )}
                Ban User
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User List with Enhanced Ban Controls */}
      <div className="space-y-3">
        {/* Select All Checkbox */}
        {!usersLoading && !usersError && users.length > 0 && (
          <div className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg border border-gray-700">
            <input
              type="checkbox"
              checked={selectedUsers.length === users.length && users.length > 0}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="w-4 h-4 text-red-500 bg-gray-700 border-gray-600 rounded focus:ring-red-500 focus:ring-2"
            />
            <label className="text-sm text-gray-300">
              Select All Users ({users.length} total)
            </label>
            {selectedUsers.length > 0 && (
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                {selectedUsers.length} selected
              </Badge>
            )}
          </div>
        )}
        {/* Loading skeleton */}
        {usersLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <div className="space-y-2">
                  <div className="h-4 w-40 bg-gray-700 rounded" />
                  <div className="flex gap-3">
                    <div className="h-3 w-20 bg-gray-700 rounded" />
                    <div className="h-3 w-12 bg-gray-700 rounded" />
                    <div className="h-5 w-16 bg-gray-700 rounded" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="h-8 w-8 bg-gray-700 rounded" />
                  <div className="h-8 w-8 bg-gray-700 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {usersError && (
          <div className="p-6 text-center text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
            <p>{usersError}</p>
            <Button
              size="sm"
              variant="outline"
              className="mt-2 border-red-500/50 text-red-400 bg-transparent"
              onClick={() => loadUsers()}
            >
              <RefreshCcw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        )}

        {/* Empty state */}
        {!usersLoading && !usersError && users.length === 0 && (
          <div className="p-6 text-center text-gray-400 bg-gray-800 rounded-lg">
            <Shield className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <p>No users found</p>
            <p className="text-sm">Try adjusting your search or filter criteria</p>
          </div>
        )}

        {/* Users list */}
        {!usersLoading && !usersError && users.map((user, index) => (
          <Card
            key={index}
            className={`bg-gray-800 border-gray-700 ${
              user.status === "banned"
                ? "border-red-500/50 bg-red-500/5"
                : user.status === "suspended"
                ? "border-yellow-500/50 bg-yellow-500/5"
                : ""
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  {/* Bulk Selection Checkbox */}
                  <div className="flex items-center pt-2">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user._id)}
                      onChange={(e) => handleUserSelection(user._id, e.target.checked)}
                      className="w-4 h-4 text-red-500 bg-gray-700 border-gray-600 rounded focus:ring-red-500 focus:ring-2"
                    />
                  </div>
                  <Avatar className="w-12 h-12 border-2 border-green-500/30">
                    <AvatarFallback className="bg-gray-700 text-green-400">
                      {user.name?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-white">{user.name || 'Unknown User'}</p>
                      <Badge
                        className={`text-xs ${
                          user.status === "active"
                            ? "bg-green-500/20 text-green-400 border-green-500/30"
                            : user.status === "banned"
                            ? "bg-red-500/20 text-red-400 border-red-500/30"
                            : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                        }`}
                      >
                        {user.status.toUpperCase()}
                      </Badge>
                      {(user.reports || 0) > 0 && (
                        <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {user.reports || 0} reports
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-green-400">{user.pubgId || 'N/A'}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
                      <span>Last active: {user.lastActive ? new Date(user.lastActive).toLocaleDateString() : 'Never'}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <p className="text-sm font-medium text-white">{user.matchCount || 0} matches</p>
                  <p className="text-sm text-green-400">₹{(user.earnings || 0).toLocaleString()}</p>
                  {user.status === "banned" && (
                    <div className="text-xs text-red-400">
                      <p>Banned: {user.banExpiry ? new Date(user.banExpiry).toLocaleDateString() : 'Permanent'}</p>
                      <p>Reason: {user.banReason || 'No reason provided'}</p>
                    </div>
                  )}
                  {user.status === "suspended" && (
                    <div className="text-xs text-yellow-400">
                      <p>Status: Suspended</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Enhanced Action Buttons */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-700">
                <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-blue-500/50 text-blue-400 bg-transparent"
                    onClick={() => loadUserDetails(user._id)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </Button>

                  {user.status === "active" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-yellow-500/50 text-yellow-400 bg-transparent"
                      onClick={() => updateUserStatus(user._id, 'suspended', 'Suspended by admin', '')}
                      disabled={userActionLoading}
                        >
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          Suspend
                        </Button>
                  )}
                </div>

                <div className="flex space-x-2">
                  {user.status === "banned" ? (
                    <Button 
                      size="sm" 
                      className="bg-green-500 hover:bg-green-600 text-black"
                      onClick={() => unbanUser(user._id, 'Unbanned by admin')}
                      disabled={userActionLoading}
                    >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Unban
                        </Button>
                  ) : user.status === "suspended" ? (
                    <div className="flex space-x-1">
                      <Button 
                        size="sm" 
                        className="bg-green-500 hover:bg-green-600 text-black"
                        onClick={() => updateUserStatus(user._id, 'active', 'Restored by admin', '')}
                        disabled={userActionLoading}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Restore
                      </Button>
                      <Button 
                        size="sm" 
                        className="bg-red-500 hover:bg-red-600 text-white"
                        onClick={() => banUser(user._id, 'Violation of terms', 'permanent', '')}
                        disabled={userActionLoading}
                      >
                            <Ban className="w-4 h-4 mr-1" />
                            Ban
                          </Button>
                            </div>
                  ) : (
                    <Button 
                      size="sm" 
                      className="bg-red-500 hover:bg-red-600 text-white"
                      onClick={() => banUser(user._id, 'Violation of terms', 'permanent', '')}
                      disabled={userActionLoading}
                    >
                      <Ban className="w-4 h-4 mr-1" />
                      Ban User
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination Controls */}
      {!usersLoading && !usersError && userPagination.pages > 1 && (
        <Card className="bg-gray-800 border-blue-500/20 mt-4">
          <CardHeader>
            <CardTitle className="text-blue-400 flex items-center justify-between">
              <span>Page Navigation</span>
              <span className="text-sm text-gray-400">
                Page {userPagination.page} of {userPagination.pages} ({userPagination.total} total users)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                className="border-blue-500/50 text-blue-400 bg-transparent"
                onClick={() => loadUsers(userPagination.page - 1, userSearch, userStatusFilter)}
                disabled={userPagination.page <= 1}
              >
                Previous
              </Button>
              
              {Array.from({ length: Math.min(5, userPagination.pages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(userPagination.pages - 4, userPagination.page - 2)) + i;
                if (pageNum > userPagination.pages) return null;
                
                return (
                  <Button
                    key={pageNum}
                    size="sm"
                    variant={pageNum === userPagination.page ? "default" : "outline"}
                    className={pageNum === userPagination.page 
                      ? "bg-blue-500 text-white" 
                      : "border-blue-500/50 text-blue-400 bg-transparent"
                    }
                    onClick={() => loadUsers(pageNum, userSearch, userStatusFilter)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              <Button
                size="sm"
                variant="outline"
                className="border-blue-500/50 text-blue-400 bg-transparent"
                onClick={() => loadUsers(userPagination.page + 1, userSearch, userStatusFilter)}
                disabled={userPagination.page >= userPagination.pages}
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Ban Dialog */}
      {showBulkBanDialog && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-red-500/30 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-red-400 flex items-center">
                <Ban className="w-5 h-5 mr-2" />
                Bulk Ban Users
              </h3>
              <Button
                size="sm"
                variant="ghost"
                className="text-gray-400 hover:text-white"
                onClick={() => setShowBulkBanDialog(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">
                  Selected Users: {selectedUsers.length}
                </label>
                <div className="text-xs text-gray-500 bg-gray-800 p-2 rounded border border-gray-700">
                  {users
                    .filter(user => selectedUsers.includes(user._id))
                    .map(user => user.pubgId || user.name)
                    .join(', ')}
                </div>
              </div>
              
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Ban Reason *</label>
                <Input
                  placeholder="Enter ban reason..."
                  className="bg-black border-gray-700 text-white"
                  value={bulkBanForm.reason}
                  onChange={(e) => setBulkBanForm({ ...bulkBanForm, reason: e.target.value })}
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Ban Duration</label>
                <Select 
                  value={bulkBanForm.duration} 
                  onValueChange={(value) => setBulkBanForm({ ...bulkBanForm, duration: value })}
                >
                  <SelectTrigger className="bg-black border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="permanent">Permanent</SelectItem>
                    <SelectItem value="7">7 Days</SelectItem>
                    <SelectItem value="30">30 Days</SelectItem>
                    <SelectItem value="90">90 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Admin Notes</label>
                <Textarea
                  placeholder="Additional notes..."
                  className="bg-black border-gray-700 text-white"
                  rows={3}
                  value={bulkBanForm.adminNotes}
                  onChange={(e) => setBulkBanForm({ ...bulkBanForm, adminNotes: e.target.value })}
                />
              </div>
              
              <div className="flex space-x-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 border-gray-500/50 text-gray-400 bg-transparent"
                  onClick={() => setShowBulkBanDialog(false)}
                  disabled={bulkActionLoading}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                  onClick={bulkBanUsers}
                  disabled={bulkActionLoading || !bulkBanForm.reason.trim()}
                >
                  {bulkActionLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Ban className="w-4 h-4 mr-2" />
                  )}
                  Ban {selectedUsers.length} User{selectedUsers.length !== 1 ? 's' : ''}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </CardContent>
  </Card>
</TabsContent>

          <TabsContent value="squads" className="space-y-4 mt-4">
            {/* Squad Management */}
            <Card className="bg-gray-900 border-green-500/20">
              <CardHeader>
                <CardTitle className="text-green-400 flex items-center justify-between">
                  Squad Management & Administration
                  <div className="flex space-x-2">
                    <Button size="sm" variant="ghost">
                      <Search className="w-4 h-4 text-gray-400" />
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Filter className="w-4 h-4 text-gray-400" />
                    </Button>
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
                                <Badge className={`${
                                  squad.status === "active" 
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
          </TabsContent>

        </Tabs>
      </div>

      {/* Full Screen Match Details View */}
      {selectedMatchForDetails && (
        <div className="fixed inset-0 z-50 bg-black overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-black/95 backdrop-blur-sm border-b border-blue-500/20 p-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-blue-400 flex items-center">
                <Eye className="w-6 h-6 mr-2" />
                Match Details & Edit
              </h1>
              <div className="flex items-center space-x-2">
                {selectedMatchForDetails && (
                  <Badge className={`${
                    selectedMatchForDetails.status === "live"
                      ? "bg-red-500/20 text-red-400 border-red-500/30"
                      : selectedMatchForDetails.status === "upcoming"
                      ? "bg-green-500/20 text-green-400 border-green-500/30"
                      : selectedMatchForDetails.status === "completed"
                      ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                      : "bg-gray-500/20 text-gray-300 border-gray-500/30"
                  }`}>
                    {selectedMatchForDetails.status.toUpperCase()}
                  </Badge>
                )}
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

          {/* Content */}
          <div className="p-6 max-w-7xl mx-auto">
            <div className="space-y-6">
              {/* Edit Mode Toggle */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Match Configuration</h3>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-blue-500/50 text-blue-400 bg-transparent"
                  onClick={() => {
                    // Initialize edit form with current match data
                    setForm({
                      name: selectedMatchForDetails.name,
                      entryFee: selectedMatchForDetails.entryFee,
                      prizePool: selectedMatchForDetails.prizePool,
                      maxPlayers: selectedMatchForDetails.maxPlayers,
                      map: selectedMatchForDetails.map,
                      startTime: new Date(selectedMatchForDetails.startTime).toISOString().slice(0, 16),
                    });
                    
                    // Initialize prize distribution
                    setRankRewards(selectedMatchForDetails.prizeDistribution.rankRewards.ranks);
                    setKill({
                      perKill: selectedMatchForDetails.prizeDistribution.killRewards.perKill,
                      maxKills: selectedMatchForDetails.prizeDistribution.killRewards.maxKills,
                    });
                    setCustoms(selectedMatchForDetails.prizeDistribution.customRewards);
                  }}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Edit Match
                        </Button>
                              </div>

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
                      const response = await axios.put(`${API_BASE}/matches/${selectedMatchForDetails._id}`, {
                        name: form.name,
                        entryFee: form.entryFee,
                        prizePool: form.prizePool,
                        maxPlayers: form.maxPlayers,
                        map: form.map,
                        startTime: new Date(form.startTime).toISOString(),
                        prizeDistribution: computed.pd,
                      });
                      
                      if (response.data?.success) {
                        // Show success toast in main admin panel
                        showToast("Match updated successfully!", "success");
                        
                        // Close the dialog immediately
                        setSelectedMatchForDetails(null);
                        setMsg(null); // Clear the message
                        
                        // Refresh the matches list
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
                    setMsg(null); // Clear any existing messages
                  }}
                >
                  Close
                            </Button>
                          </div>

              {/* Success/Error Toast */}
              {msg && (
                <div
                  className={`fixed top-20 right-6 z-60 text-sm p-4 rounded-lg shadow-lg border transition-all duration-300 ${
                    msg.toLowerCase().includes("success")
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

      {/* User Details Modal */}
      {selectedUser && (
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="bg-gray-900 border-blue-500/30 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-blue-400 flex items-center justify-between">
                <span>User Details - {selectedUser.name || 'Unknown User'}</span>
                <Badge className={`${
                  selectedUser.status === "active"
                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                    : selectedUser.status === "banned"
                    ? "bg-red-500/20 text-red-400 border-red-500/30"
                    : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                }`}>
                  {selectedUser.status.toUpperCase()}
                </Badge>
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Name</label>
                  <p className="text-white font-medium">{selectedUser.name || 'Unknown User'}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">PUBG ID</label>
                  <p className="text-white">{selectedUser.pubgId || 'N/A'}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Email</label>
                  <p className="text-white">{selectedUser.email}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Phone</label>
                  <p className="text-white">{selectedUser.phone || 'N/A'}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Join Date</label>
                  <p className="text-white">{new Date(selectedUser.createdAt).toLocaleString()}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Last Active</label>
                  <p className="text-white">{selectedUser.lastActive ? new Date(selectedUser.lastActive).toLocaleString() : 'Never'}</p>
                </div>
              </div>

              {/* Game Statistics */}
              {selectedUser.statistics && (
                <Card className="bg-gray-800 border-green-500/20">
                  <CardHeader>
                    <CardTitle className="text-green-400">Game Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-lg font-bold text-yellow-400">{selectedUser.statistics.totalMatches}</p>
                        <p className="text-xs text-gray-400">Total Matches</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-green-400">{selectedUser.statistics.wins}</p>
                        <p className="text-xs text-gray-400">Wins</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-blue-400">{selectedUser.statistics.winRate}%</p>
                        <p className="text-xs text-gray-400">Win Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
              )}

              {/* Match History */}
              {selectedUser.matchHistory && selectedUser.matchHistory.length > 0 && (
                <Card className="bg-gray-800 border-yellow-500/20">
                  <CardHeader>
                    <CardTitle className="text-yellow-400">Recent Match History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedUser.matchHistory.map((match: any, index: number) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-900 rounded text-sm">
                          <span className="text-white">{match.name}</span>
                          <span className="text-gray-400">
                            {new Date(match.startTime).toLocaleDateString()} - {match.status}
                          </span>
                        </div>
        ))}
      </div>
                  </CardContent>
                </Card>
              )}

              {/* Status History */}
              {selectedUser.statusHistory && selectedUser.statusHistory.length > 0 && (
                <Card className="bg-gray-800 border-purple-500/20">
        <CardHeader>
                    <CardTitle className="text-purple-400">Status Change History</CardTitle>
        </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedUser.statusHistory.map((status: any, index: number) => (
                        <div key={index} className="p-2 bg-gray-900 rounded text-sm">
                          <div className="flex items-center justify-between mb-1">
                            <Badge className={`${
                              status.status === "active"
                                ? "bg-green-500/20 text-green-400 border-green-500/30"
                                : status.status === "banned"
                                ? "bg-red-500/20 text-red-400 border-red-500/30"
                                : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                            }`}>
                              {status.status.toUpperCase()}
                            </Badge>
                            <span className="text-gray-400 text-xs">
                              {new Date(status.changedAt).toLocaleDateString()}
                            </span>
            </div>
                          <p className="text-white text-xs">Reason: {status.reason}</p>
                          {status.adminNotes && (
                            <p className="text-gray-400 text-xs">Notes: {status.adminNotes}</p>
                          )}
            </div>
                      ))}
          </div>
        </CardContent>
      </Card>
              )}

              {/* Admin Notes */}
              {selectedUser.adminNotes && (
                <Card className="bg-gray-800 border-orange-500/20">
                  <CardHeader>
                    <CardTitle className="text-orange-400">Admin Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-white">{selectedUser.adminNotes}</p>
    </CardContent>
  </Card>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Toast Notifications */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 text-sm p-4 rounded-lg shadow-lg border transition-all duration-300 ${
            toast.type === 'success'
              ? "bg-green-500/90 text-green-100 border-green-400/50"
              : "bg-red-500/90 text-red-100 border-red-400/50"
          }`}
        >
          <div className="flex items-center space-x-2">
            {toast.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-200" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-200" />
            )}
            <span className="font-medium">{toast.message}</span>
            <Button
              size="sm"
              variant="ghost"
              className="ml-2 p-1 h-6 w-6 text-white/70 hover:text-white hover:bg-white/20"
              onClick={() => setToast(null)}
            >
              <X className="w-4 h-4" />
            </Button>
      </div>
        </div>
      )}
    </div>
  );
}
