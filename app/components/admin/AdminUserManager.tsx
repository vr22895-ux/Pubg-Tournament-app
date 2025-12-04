"use client";

import React, { useState, useEffect } from "react";
import { userService } from "../../services/userService";
import {
    Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Search, Filter, Shield, Loader2, Ban, AlertTriangle, RefreshCcw, Eye, CheckCircle, X
} from "lucide-react";

export default function AdminUserManager() {
    const [users, setUsers] = useState<any[]>([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [usersError, setUsersError] = useState<string | null>(null);
    const [userSearch, setUserSearch] = useState("");
    const [userStatusFilter, setUserStatusFilter] = useState("all");
    const [userPagination, setUserPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [showBulkBanDialog, setShowBulkBanDialog] = useState(false);
    const [bulkActionLoading, setBulkActionLoading] = useState(false);
    const [userActionLoading, setUserActionLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const [bulkBanForm, setBulkBanForm] = useState({
        reason: "",
        duration: "permanent",
        adminNotes: "",
    });

    // Show toast notification
    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const loadUsers = async (page = 1, search = "", status = "all") => {
        setUsersLoading(true);
        setUsersError(null);
        try {
            const params: any = {
                page: page.toString(),
                limit: "10",
            };
            if (search) params.search = search;
            if (status !== "all") params.status = status;

            const data = await userService.getUsers(params);

            if (data?.success) {
                setUsers(data.data);
                setUserPagination(data.pagination);
            } else {
                setUsersError("Failed to load users");
            }
        } catch (error: any) {
            setUsersError(error?.response?.data?.error || "Failed to load users");
        } finally {
            setUsersLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUserDetails = async (userId: string) => {
        try {
            const data = await userService.getUserDetails(userId);
            if (data?.success) {
                setSelectedUser(data.data);
            }
        } catch (error: any) {
            showToast(error?.response?.data?.error || "Failed to load user details", "error");
        }
    };

    const updateUserStatus = async (userId: string, status: string, reason: string, duration: string) => {
        setUserActionLoading(true);
        try {
            const data = await userService.updateUserStatus(userId, status, reason, duration);

            if (data?.success) {
                showToast(`User status updated to ${status}`, "success");
                loadUsers(userPagination.page, userSearch, userStatusFilter);
                if (selectedUser && selectedUser._id === userId) {
                    loadUserDetails(userId);
                }
            }
        } catch (error: any) {
            showToast(error?.response?.data?.error || "Failed to update user status", "error");
        } finally {
            setUserActionLoading(false);
        }
    };

    const banUser = (userId: string, reason: string, duration: string, notes: string) => {
        updateUserStatus(userId, 'banned', reason, duration);
    };

    const unbanUser = (userId: string, reason: string) => {
        updateUserStatus(userId, 'active', reason, '');
    };

    const banUserByPubgId = async (pubgId: string, reason: string, duration: string, notes: string) => {
        setBulkActionLoading(true);
        try {
            const data = await userService.banUserByPubgId(pubgId, reason, duration, notes);

            if (data?.success) {
                showToast(`User with PUBG ID ${pubgId} has been banned`, "success");
                loadUsers(userPagination.page, userSearch, userStatusFilter);
            }
        } catch (error: any) {
            showToast(error?.response?.data?.error || "Failed to ban user", "error");
        } finally {
            setBulkActionLoading(false);
        }
    };

    const bulkBanUsers = async () => {
        if (selectedUsers.length === 0) return;

        setBulkActionLoading(true);
        try {
            const data = await userService.bulkBanUsers(selectedUsers, bulkBanForm.reason, bulkBanForm.duration, bulkBanForm.adminNotes);

            if (data?.success) {
                showToast(`Successfully banned ${selectedUsers.length} users`, "success");
                setSelectedUsers([]);
                setShowBulkBanDialog(false);
                setBulkBanForm({ reason: "", duration: "permanent", adminNotes: "" });
                loadUsers(userPagination.page, userSearch, userStatusFilter);
            }
        } catch (error: any) {
            showToast(error?.response?.data?.error || "Failed to bulk ban users", "error");
        } finally {
            setBulkActionLoading(false);
        }
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedUsers(users.map(u => u._id));
        } else {
            setSelectedUsers([]);
        }
    };

    const handleUserSelection = (userId: string, checked: boolean) => {
        if (checked) {
            setSelectedUsers(prev => [...prev, userId]);
        } else {
            setSelectedUsers(prev => prev.filter(id => id !== userId));
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
                        User Management & Ban Controls
                        <div className="flex space-x-2">
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
                                className={`bg-gray-800 border-gray-700 ${user.status === "banned"
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
                                                        className={`text-xs ${user.status === "active"
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

            {/* User Details Modal */}
            {selectedUser && (
                <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
                    <DialogContent className="bg-gray-900 border-blue-500/30 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-blue-400 flex items-center justify-between">
                                <span>User Details - {selectedUser.name || 'Unknown User'}</span>
                                <Badge className={`${selectedUser.status === "active"
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
                                                        <Badge className={`${status.status === "active"
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
        </div>
    );
}
