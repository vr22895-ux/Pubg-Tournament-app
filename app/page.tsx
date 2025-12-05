"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { invitationService } from "./services/invitationService"
import AdminPanel from "./AdminPanel"
import HomeScreen from "./home"
import LoginScreen from "./LoginScreen"
import type { Screen } from "./LoginScreen"
import SquadScreen from './components/SquadScreen';
import WalletScreen from './components/WalletScreen';
import MyMatchesScreen from './components/MyMatchesScreen';
import SettingsScreen from './components/SettingsScreen';
import LeaderboardScreen from './components/LeaderboardScreen';

// Main App
export default function PUBGTournamentApp() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("login")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState<"user" | "admin">("user")
  const [walletBalance, setWalletBalance] = useState(0)
  const [pendingInvitationsCount, setPendingInvitationsCount] = useState(0)

  // Load pending invitations count
  const loadPendingInvitationsCount = async () => {
    try {
      const raw = localStorage.getItem("user")
      if (raw) {
        const user = JSON.parse(raw)
        const response = await invitationService.getUserInvitations(user._id)
        if (response?.success) {
          setPendingInvitationsCount(response.data.length)
        }
      }
    } catch (error) {
      console.error("Failed to load invitations count:", error)
    }
  }

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

        // Restore user role
        if (user.role) {
          setUserRole(user.role)
        }
      }

      // Check URL params for screen navigation (e.g. payment callback)
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('screen') === 'wallet' || params.get('test_payment') === 'true') {
          setCurrentScreen("wallet");
        }
      }
    } catch { }
  }, [])

  const handleLogout = () => {
    try { localStorage.removeItem("user") } catch { }
    setIsLoggedIn(false)
    setCurrentScreen("login")
  }

  // Import WalletScreen component
  const WalletScreenComponent = () => <WalletScreen onLogout={handleLogout} onNavigate={setCurrentScreen} />;

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
      return <MyMatchesScreen onLogout={handleLogout} onNavigate={setCurrentScreen} />
    case "leaderboard":
      return <LeaderboardScreen onNavigate={setCurrentScreen} />
    case "live":
      return <LiveScreen />
    case "settings":
      return <SettingsScreen onLogout={handleLogout} onNavigate={setCurrentScreen} />
    default:
      return <HomeScreen currentScreen={currentScreen} setCurrentScreen={setCurrentScreen} walletBalance={walletBalance} setIsLoggedIn={setIsLoggedIn} />
  }
}
