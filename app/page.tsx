"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Users,
  Trophy,
  Wallet,
  Play,
  Settings,
  Shield,
  Clock,
  IndianRupee,
  Target,
  Crown,
  Zap,
  Plus,
  Eye,
  UserPlus,
  Calendar,
  Video,
  MessageSquare,
  Ban,
  Copy,
  Share2,
  Star,
  Flame,
  Lock,
  History,
  Filter,
  Bell,
  Home,
  User,
  LogOut,
  DollarSign,
  Send,
  CheckCircle,
} from "lucide-react"
import AdminPanel from "./AdminPanel"
import HomeScreen from "./home"
import LoginScreen from "./LoginScreen"
import type { Screen } from "./LoginScreen"
import axios from "axios";
import SquadScreen from './components/SquadScreen';
import WalletScreen from './components/WalletScreen';

// Main App
export default function PUBGTournamentApp() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("login")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState<"user" | "admin">("user")
  const [selectedMatch, setSelectedMatch] = useState<any>(null)
  const [walletBalance, setWalletBalance] = useState(0)
  const [showRoomDetails, setShowRoomDetails] = useState(false)
  const [pendingInvitationsCount, setPendingInvitationsCount] = useState(0)

  // Hydrate from localStorage (auto-login)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("user")
      if (raw) {
        const user = JSON.parse(raw)
        setIsLoggedIn(true)
        setCurrentScreen("home")
        // Load user's wallet balance
        if (user.walletBalance) {
          setWalletBalance(user.walletBalance)
        }
        // Load pending invitations count
        loadPendingInvitationsCount()
      }
    } catch {}
  }, [])

    const handleLogout = () => {
      try { localStorage.removeItem("user") } catch {}
      setIsLoggedIn(false)
      setCurrentScreen("login")
    }

  // Load pending invitations count
  const loadPendingInvitationsCount = async () => {
    try {
      const raw = localStorage.getItem("user")
      if (raw) {
        const user = JSON.parse(raw)
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001/api'}/invitations/user/${user._id}`)
        if (response.data?.success) {
          setPendingInvitationsCount(response.data.data.length)
        }
      }
    } catch (error) {
      console.error("Failed to load invitations count:", error)
    }
  }

  // Import WalletScreen component
  const WalletScreenComponent = () => <WalletScreen onLogout={handleLogout} onNavigate={setCurrentScreen} />;

  const MyMatchesScreen = () => (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-center">
        <h1 className="text-2xl font-bold text-green-400 mb-4">My Matches</h1>
        <p className="text-gray-400">Match history coming soon...</p>
        <Button onClick={handleLogout} className="mt-4 bg-red-500 hover:bg-red-600">
          Logout
              </Button>
      </div>
      </div>
    )

  const LiveScreen = () => (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
                      <div className="text-center">
        <h1 className="text-2xl font-bold text-green-400 mb-4">Live Matches</h1>
        <p className="text-gray-400">Live streaming coming soon...</p>
        <Button onClick={handleLogout} className="mt-4 bg-red-500 hover:bg-red-600">
          Logout
                      </Button>
      </div>
      </div>
    )

  const SettingsScreen = () => (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-green-400 mb-4">Settings</h1>
        <p className="text-gray-400">Settings panel coming soon...</p>
        <Button onClick={handleLogout} className="mt-4 bg-red-500 hover:bg-red-600">
                  Logout
                </Button>
      </div>
    </div>
  )

  // ---------- Router ----------
  if (!isLoggedIn) {
    return (
      <LoginScreen
        setIsLoggedIn={setIsLoggedIn}
        setCurrentScreen={setCurrentScreen}
        setUserRole={setUserRole}
      />
    )
  }

  if (userRole === "admin") {
    return <AdminPanel onSwitchToUser={() => setUserRole("user")} />
  }

 

  switch (currentScreen) {
    case "home":
      return <HomeScreen currentScreen={currentScreen} setCurrentScreen={setCurrentScreen} walletBalance={walletBalance} setIsLoggedIn={setIsLoggedIn} />
    case "squad":
      return <SquadScreen onLogout={handleLogout} onNavigate={setCurrentScreen} />
    case "wallet":
      return <WalletScreenComponent />
    case "matches":
      return <MyMatchesScreen />
    // case "leaderboard":
    //   return <LeaderboardScreen />
    case "live":
      return <LiveScreen />
    case "settings":
      return <SettingsScreen />
    default:
      return <HomeScreen currentScreen={currentScreen} setCurrentScreen={setCurrentScreen} walletBalance={walletBalance} setIsLoggedIn={setIsLoggedIn} />
  }
}
