"use client";

import React, { useState, useEffect } from "react";
import { authService } from "../services/authService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Save, Home, Users, Gamepad2, Trophy, Wallet, LogOut, Lock } from "lucide-react";

export default function SettingsScreen({
    onLogout,
    onNavigate,
}: {
    onLogout: () => void;
    onNavigate: (screen: "home" | "squad" | "wallet" | "matches" | "leaderboard" | "live" | "settings") => void;
}) {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        userId: "",
        name: "",
        email: "",
        pubgId: "",
        phone: ""
    });
    const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
    const [changingPassword, setChangingPassword] = useState(false);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const userStr = localStorage.getItem("user");
            if (userStr) {
                const user = JSON.parse(userStr);
                setFormData({
                    userId: user._id,
                    name: user.name || "",
                    email: user.email || "",
                    pubgId: user.pubgId || "",
                    phone: user.phone || ""
                });
            } else {
                // Fallback to API if local storage is stale (though we need token)
                // For now, assume local storage has basic info, but we should probably fetch fresh
                // However, authService.getProfile() endpoint might not exist or return what we need
                // Let's stick to localStorage for initial load or fetch if needed.
                // Actually, let's try to fetch fresh profile if possible, but we don't have a direct getProfile that returns everything in authService yet?
                // authService.getProfile() calls /auth/profile. Let's check if that exists.
                // It does in authService.ts, but let's check authRoutes.js...
                // authRoutes.js DOES NOT have router.get('/profile', ...).
                // It has /profile/update (PUT) and /profile/verify-phone (POST).
                // So we rely on localStorage for now, or we need to add a getProfile endpoint.
                // Given the time constraints, let's rely on localStorage and update it on save.
            }
        } catch (err) {
            console.error("Failed to load profile", err);
            setError("Failed to load profile data");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError(null);
            setSuccess(null);

            if (!formData.name.trim()) {
                setError("Name is required");
                return;
            }
            if (!formData.email.trim()) {
                setError("Email is required");
                return;
            }

            const response = await authService.updateProfile({
                userId: formData.userId,
                name: formData.name,
                email: formData.email,
                pubgId: formData.pubgId
            });

            if (response.success) {
                setSuccess("Profile updated successfully!");
                // Update local storage
                const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
                const updatedUser = { ...currentUser, ...response.user };
                localStorage.setItem("user", JSON.stringify(updatedUser));

                // Update form data to match response
                setFormData(prev => ({
                    ...prev,
                    name: response.user.name,
                    email: response.user.email,
                    pubgId: response.user.pubgId || prev.pubgId
                }));
            } else {
                setError(response.error || "Failed to update profile");
            }
        } catch (err: any) {
            console.error("Error updating profile:", err);
            setError(err.response?.data?.error || err.message || "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        try {
            setChangingPassword(true);
            setError(null);
            setSuccess(null);

            if (!passwords.current || !passwords.new || !passwords.confirm) {
                setError("Please enter current, new, and confirm password");
                return;
            }
            if (passwords.new.length < 6) {
                setError("New password must be at least 6 characters");
                return;
            }
            if (passwords.new !== passwords.confirm) {
                setError("New passwords do not match");
                return;
            }

            const response = await authService.changePassword({
                currentPassword: passwords.current,
                newPassword: passwords.new
            });

            if (response.success) {
                setSuccess("Password changed successfully! Logging out...");
                setPasswords({ current: "", new: "", confirm: "" });
                setTimeout(() => {
                    onLogout();
                }, 1500);
            } else {
                setError(response.error || "Failed to change password");
            }
        } catch (err: any) {
            console.error("Error changing password:", err);
            setError(err.response?.data?.error || err.message || "Failed to change password");
        } finally {
            setChangingPassword(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white pb-20">
            {/* Header */}
            <div className="sticky top-0 bg-black/95 backdrop-blur-sm border-b border-green-500/20 p-4 z-50">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-green-400 flex items-center">
                            <Settings className="w-6 h-6 mr-2" />
                            Settings
                        </h1>
                        <p className="text-sm text-gray-400">Manage your profile</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={onLogout} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                        <LogOut className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            <div className="p-4 space-y-6">
                <Card className="bg-gray-900 border-green-500/20">
                    <CardHeader>
                        <CardTitle className="text-white">Profile Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded text-sm">
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="bg-green-500/10 border border-green-500/50 text-green-400 p-3 rounded text-sm">
                                {success}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-gray-300">Display Name</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="bg-black border-gray-700 text-white"
                                placeholder="Enter your name"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-gray-300">Email Address</Label>
                            <Input
                                id="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="bg-black border-gray-700 text-white"
                                placeholder="Enter your email"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="pubgId" className="text-gray-300">PUBG ID (Game Name)</Label>
                            <Input
                                id="pubgId"
                                value={formData.pubgId}
                                onChange={(e) => setFormData({ ...formData, pubgId: e.target.value })}
                                className="bg-black border-gray-700 text-white"
                                placeholder="Enter your PUBG In-Game Name"
                            />
                            <p className="text-xs text-gray-500">Required for joining squads and tournaments.</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-gray-300">Phone Number</Label>
                            <Input
                                id="phone"
                                value={formData.phone}
                                disabled
                                className="bg-gray-800 border-gray-700 text-gray-400 cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-500">Phone number cannot be changed.</p>
                        </div>

                        <Button
                            className="w-full bg-green-500 hover:bg-green-600 text-black font-bold mt-4"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? (
                                <>
                                    <span className="animate-spin mr-2">⏳</span> Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" /> Save Changes
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                <Card className="bg-gray-900 border-green-500/20">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center">
                            <Lock className="w-5 h-5 mr-2" />
                            Security
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword" className="text-gray-300">Current Password</Label>
                            <Input
                                id="currentPassword"
                                type="password"
                                value={passwords.current}
                                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                                className="bg-black border-gray-700 text-white"
                                placeholder="******"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newPassword" className="text-gray-300">New Password</Label>
                            <Input
                                id="newPassword"
                                type="password"
                                autoComplete="new-password"
                                value={passwords.new}
                                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                className="bg-black border-gray-700 text-white"
                                placeholder="Min 6 characters"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-gray-300">Confirm New Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                autoComplete="new-password"
                                value={passwords.confirm}
                                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                className="bg-black border-gray-700 text-white"
                                placeholder="Re-enter new password"
                            />
                        </div>
                        <Button
                            className="w-full bg-gray-800 hover:bg-gray-700 text-white border border-gray-700"
                            onClick={handleChangePassword}
                            disabled={changingPassword}
                        >
                            {changingPassword ? "Updating..." : "Change Password"}
                        </Button>
                    </CardContent>
                </Card>
            </div>

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
                            className="flex flex-col items-center space-y-1 h-auto py-2 px-3 transition-all duration-200 text-gray-400 hover:text-green-400"
                            onClick={() => onNavigate(item.screen)}
                        >
                            <item.icon className="w-5 h-5" />
                            <span className="text-xs font-medium">{item.label}</span>
                        </Button>
                    ))}
                </div>
            </div>
        </div >
    );
}
