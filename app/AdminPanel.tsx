"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  LogOut, Shield, LayoutDashboard, Trophy, Users, Swords, Award
} from "lucide-react";

// Import decomposed components
import AdminCreateMatch from "./components/admin/AdminCreateMatch";
import AdminMatchManager from "./components/admin/AdminMatchManager";
import AdminResultsManager from "./components/admin/AdminResultsManager";
import AdminUserManager from "./components/admin/AdminUserManager";
import AdminSquadManager from "./components/admin/AdminSquadManager";

export default function AdminPanel({ onSwitchToUser }: { onSwitchToUser: () => void }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("create");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check admin status
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      window.location.href = "/";
      return;
    }
    try {
      const user = JSON.parse(userStr);
      if (user.role !== "admin") {
        window.location.href = "/";
        return;
      }
      setIsAdmin(true);
    } catch (e) {
      window.location.href = "/";
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-gray-900/50 p-6 rounded-2xl border border-gray-800 backdrop-blur-sm">
        <div className="flex items-center space-x-4 mb-4 md:mb-0">
          <div className="p-3 bg-red-600 rounded-xl shadow-lg shadow-red-900/20">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Manage matches, users, and tournament results
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-300"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 bg-gray-900/80 p-1 rounded-xl border border-gray-800 h-auto">
          <TabsTrigger
            value="create"
            className="data-[state=active]:bg-red-600 data-[state=active]:text-white py-3 rounded-lg transition-all duration-300"
          >
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Create Match
          </TabsTrigger>
          <TabsTrigger
            value="manage"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white py-3 rounded-lg transition-all duration-300"
          >
            <Swords className="w-4 h-4 mr-2" />
            Manage Matches
          </TabsTrigger>
          <TabsTrigger
            value="results"
            className="data-[state=active]:bg-yellow-600 data-[state=active]:text-white py-3 rounded-lg transition-all duration-300"
          >
            <Trophy className="w-4 h-4 mr-2" />
            Results
          </TabsTrigger>
          <TabsTrigger
            value="users"
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white py-3 rounded-lg transition-all duration-300"
          >
            <Users className="w-4 h-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger
            value="squads"
            className="data-[state=active]:bg-green-600 data-[state=active]:text-white py-3 rounded-lg transition-all duration-300"
          >
            <Award className="w-4 h-4 mr-2" />
            Squads
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-4 mt-4">
          <AdminCreateMatch onMatchCreated={() => setActiveTab("manage")} />
        </TabsContent>

        <TabsContent value="manage" className="space-y-4 mt-4">
          <AdminMatchManager />
        </TabsContent>

        <TabsContent value="results" className="space-y-4 mt-4">
          <AdminResultsManager />
        </TabsContent>

        <TabsContent value="users" className="space-y-4 mt-4">
          <AdminUserManager />
        </TabsContent>

        <TabsContent value="squads" className="space-y-4 mt-4">
          <AdminSquadManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
