"use client"

import { useState } from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  StyleSheet,
  Dimensions,
  FlatList,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import LinearGradient from "react-native-linear-gradient"
import Icon from "react-native-vector-icons/MaterialIcons"
import IconCommunity from "react-native-vector-icons/MaterialCommunityIcons"

const { width, height } = Dimensions.get("window")

const App = () => {
  const [currentScreen, setCurrentScreen] = useState("login")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState("user")
  const [walletBalance, setWalletBalance] = useState(2450)

  // Login Screen Component
  const LoginScreen = () => {
    const [loginStep, setLoginStep] = useState("phone")
    const [phoneNumber, setPhoneNumber] = useState("")
    const [otp, setOtp] = useState("")
    const [pubgId, setPubgId] = useState("")
    const [email, setEmail] = useState("")

    return (
      <View style={styles.container}>
        <StatusBar backgroundColor="#000000" barStyle="light-content" />

        {/* Animated Background */}
        <LinearGradient colors={["#000000", "#0a1a0a", "#000000"]} style={styles.backgroundGradient} />

        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            {/* Logo Section */}
            <View style={styles.logoSection}>
              <LinearGradient colors={["#22c55e", "#16a34a"]} style={styles.logoContainer}>
                <IconCommunity name="target" size={48} color="#000000" />
              </LinearGradient>

              <LinearGradient colors={["#22c55e", "#16a34a", "#15803d"]} style={styles.titleGradient}>
                <Text style={styles.title}>PUBG ARENA</Text>
              </LinearGradient>

              <Text style={styles.subtitle}>Elite Mobile Esports Tournament</Text>

              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </View>

            {/* Login Form */}
            <View style={styles.loginCard}>
              <Text style={styles.cardTitle}>
                {loginStep === "phone" && "Enter Phone Number"}
                {loginStep === "otp" && "Verify OTP"}
                {loginStep === "register" && "Complete Registration"}
              </Text>

              {loginStep === "phone" && (
                <View style={styles.formContainer}>
                  <View style={styles.inputContainer}>
                    <Icon name="phone" size={20} color="#22c55e" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter your phone number"
                      placeholderTextColor="#6b7280"
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      keyboardType="phone-pad"
                    />
                  </View>

                  <TouchableOpacity style={styles.primaryButton} onPress={() => setLoginStep("otp")}>
                    <LinearGradient colors={["#22c55e", "#16a34a"]} style={styles.buttonGradient}>
                      <Icon name="send" size={16} color="#000000" />
                      <Text style={styles.primaryButtonText}>Send OTP</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>Or continue with</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <View style={styles.inputContainer}>
                    <Icon name="email" size={20} color="#3b82f6" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter your email"
                      placeholderTextColor="#6b7280"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                    />
                  </View>

                  <TouchableOpacity style={styles.secondaryButton} onPress={() => setLoginStep("register")}>
                    <Icon name="email" size={16} color="#3b82f6" />
                    <Text style={styles.secondaryButtonText}>Continue with Email</Text>
                  </TouchableOpacity>
                </View>
              )}

              {loginStep === "otp" && (
                <View style={styles.formContainer}>
                  <Text style={styles.otpDescription}>Enter the 6-digit OTP sent to {phoneNumber}</Text>

                  <TextInput
                    style={styles.otpInput}
                    placeholder="Enter OTP"
                    placeholderTextColor="#6b7280"
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="numeric"
                    maxLength={6}
                    textAlign="center"
                  />

                  <TouchableOpacity style={styles.primaryButton} onPress={() => setLoginStep("register")}>
                    <LinearGradient colors={["#22c55e", "#16a34a"]} style={styles.buttonGradient}>
                      <Text style={styles.primaryButtonText}>Verify OTP</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => setLoginStep("phone")}>
                    <Text style={styles.linkText}>Change Phone Number</Text>
                  </TouchableOpacity>
                </View>
              )}

              {loginStep === "register" && (
                <View style={styles.formContainer}>
                  <View style={styles.inputContainer}>
                    <IconCommunity name="gamepad-variant" size={20} color="#22c55e" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="PUBG In-Game ID (Required)"
                      placeholderTextColor="#6b7280"
                      value={pubgId}
                      onChangeText={setPubgId}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Icon name="email" size={20} color="#3b82f6" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Email Address (Required)"
                      placeholderTextColor="#6b7280"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => {
                      setIsLoggedIn(true)
                      setCurrentScreen("home")
                    }}
                  >
                    <LinearGradient colors={["#22c55e", "#16a34a"]} style={styles.buttonGradient}>
                      <Icon name="check-circle" size={16} color="#000000" />
                      <Text style={styles.primaryButtonText}>Complete Registration</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    )
  }

  // Home Screen Component
  const HomeScreen = () => {
    const matches = [
      {
        id: 1,
        name: "Championship Battle",
        startTime: "15:30",
        entryFee: 100,
        prizePool: 8000,
        playersJoined: 64,
        maxPlayers: 88,
        map: "Erangel",
        timeLeft: "12 min",
      },
      {
        id: 2,
        name: "Elite Squad Wars",
        startTime: "16:00",
        entryFee: 100,
        prizePool: 8000,
        playersJoined: 48,
        maxPlayers: 88,
        map: "Sanhok",
        timeLeft: "42 min",
      },
      {
        id: 3,
        name: "Pro League Finals",
        startTime: "16:30",
        entryFee: 100,
        prizePool: 8000,
        playersJoined: 72,
        maxPlayers: 88,
        map: "Miramar",
        timeLeft: "1h 12m",
      },
    ]

    const renderMatch = ({ item }) => (
      <View style={styles.matchCard}>
        <View style={styles.matchHeader}>
          <View style={styles.matchImageContainer}>
            <LinearGradient colors={["#22c55e", "#16a34a"]} style={styles.matchImage}>
              <IconCommunity name="target" size={32} color="#000000" />
            </LinearGradient>
            <View style={styles.timeLeftBadge}>
              <Icon name="timer" size={12} color="#ffffff" />
              <Text style={styles.timeLeftText}>{item.timeLeft}</Text>
            </View>
          </View>

          <View style={styles.matchInfo}>
            <View style={styles.matchTitleRow}>
              <Text style={styles.matchTitle}>{item.name}</Text>
              <View style={styles.mapBadge}>
                <Text style={styles.mapText}>{item.map}</Text>
              </View>
            </View>

            <View style={styles.matchStats}>
              <View style={styles.statItem}>
                <Icon name="attach-money" size={16} color="#fbbf24" />
                <Text style={styles.statText}>Entry: ₹{item.entryFee}</Text>
              </View>
              <View style={styles.statItem}>
                <Icon name="emoji-events" size={16} color="#22c55e" />
                <Text style={styles.statText}>Prize: ₹{item.prizePool.toLocaleString()}</Text>
              </View>
              <View style={styles.statItem}>
                <Icon name="people" size={16} color="#9ca3af" />
                <Text style={styles.statText}>
                  {item.playersJoined}/{item.maxPlayers} Players
                </Text>
              </View>
              <View style={styles.statItem}>
                <Icon name="schedule" size={16} color="#3b82f6" />
                <Text style={styles.statText}>{item.startTime}</Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <LinearGradient
                  colors={["#22c55e", "#16a34a"]}
                  style={[styles.progressFill, { width: `${(item.playersJoined / item.maxPlayers) * 100}%` }]}
                />
              </View>
            </View>

            <View style={styles.matchActions}>
              <TouchableOpacity style={styles.joinButton}>
                <LinearGradient colors={["#22c55e", "#16a34a"]} style={styles.joinButtonGradient}>
                  <IconCommunity name="sword" size={16} color="#000000" />
                  <Text style={styles.joinButtonText}>Join Battle</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton}>
                <Icon name="people" size={20} color="#22c55e" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton}>
                <Icon name="share" size={20} color="#22c55e" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    )

    return (
      <View style={styles.container}>
        <StatusBar backgroundColor="#000000" barStyle="light-content" />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <IconCommunity name="target" size={24} color="#22c55e" />
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Battle Lobby</Text>
              <Text style={styles.headerSubtitle}>Ready for combat, soldier?</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <View style={styles.walletBadge}>
              <Icon name="account-balance-wallet" size={16} color="#22c55e" />
              <Text style={styles.walletText}>₹{walletBalance.toLocaleString()}</Text>
            </View>

            <TouchableOpacity onPress={() => setCurrentScreen("wallet")}>
              <Icon name="account-balance-wallet" size={24} color="#22c55e" />
            </TouchableOpacity>

            <TouchableOpacity>
              <Icon name="notifications" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.content}>
          {/* Quick Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <LinearGradient colors={["#22c55e20", "#16a34a10"]} style={styles.statCardGradient}>
                <Icon name="emoji-events" size={24} color="#fbbf24" />
                <Text style={styles.statNumber}>12</Text>
                <Text style={styles.statLabel}>Wins</Text>
              </LinearGradient>
            </View>

            <View style={styles.statCard}>
              <LinearGradient colors={["#ef444420", "#dc262610"]} style={styles.statCardGradient}>
                <IconCommunity name="target" size={24} color="#ef4444" />
                <Text style={styles.statNumber}>156</Text>
                <Text style={styles.statLabel}>Kills</Text>
              </LinearGradient>
            </View>

            <View style={styles.statCard}>
              <LinearGradient colors={["#3b82f620", "#2563eb10"]} style={styles.statCardGradient}>
                <IconCommunity name="crown" size={24} color="#3b82f6" />
                <Text style={styles.statNumber}>#47</Text>
                <Text style={styles.statLabel}>Rank</Text>
              </LinearGradient>
            </View>
          </View>

          {/* Live Matches Banner */}
          <TouchableOpacity style={styles.liveBanner} onPress={() => setCurrentScreen("live")}>
            <LinearGradient colors={["#ef444420", "#dc262610"]} style={styles.liveBannerGradient}>
              <View style={styles.liveBannerContent}>
                <View style={styles.liveBannerLeft}>
                  <View style={styles.livePulse} />
                  <View>
                    <Text style={styles.liveBannerTitle}>3 LIVE MATCHES</Text>
                    <Text style={styles.liveBannerSubtitle}>Watch now and learn from pros</Text>
                  </View>
                </View>

                <View style={styles.watchButton}>
                  <Icon name="visibility" size={16} color="#ffffff" />
                  <Text style={styles.watchButtonText}>Watch</Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Upcoming Matches */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Matches</Text>
            <View style={styles.availableBadge}>
              <Text style={styles.availableText}>{matches.length} Available</Text>
            </View>
          </View>

          <FlatList
            data={matches}
            renderItem={renderMatch}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        </ScrollView>

        <BottomNavigation />
      </View>
    )
  }

  // Squad Screen Component
  const SquadScreen = () => {
    const squadMembers = [
      { id: 1, name: "You", pubgId: "PlayerPro123", level: 45, isLeader: true, status: "online" },
      { id: 2, name: "WarriorX", pubgId: "WarriorX99", level: 38, isLeader: false, status: "online" },
      { id: 3, name: "SniperKing", pubgId: "SniperKing", level: 42, isLeader: false, status: "away" },
      { id: 4, name: "", pubgId: "", level: 0, isLeader: false, status: "empty" },
    ]

    const renderSquadMember = (member, index) => (
      <View key={index} style={styles.squadMemberContainer}>
        {member.status === "empty" ? (
          <View style={styles.emptySlot}>
            <View style={styles.emptySlotCircle}>
              <Icon name="add" size={24} color="#6b7280" />
            </View>
            <Text style={styles.emptySlotText}>Empty Slot</Text>
            <TouchableOpacity style={styles.inviteButton}>
              <Text style={styles.inviteButtonText}>Invite</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.squadMember}>
            <View style={styles.memberAvatar}>
              <Text style={styles.memberAvatarText}>{member.name[0]}</Text>
              <View
                style={[
                  styles.statusIndicator,
                  { backgroundColor: member.status === "online" ? "#22c55e" : "#fbbf24" },
                ]}
              />
              {member.isLeader && <IconCommunity name="crown" size={16} color="#fbbf24" style={styles.crownIcon} />}
            </View>
            <Text style={styles.memberName}>{member.name}</Text>
            <Text style={styles.memberLevel}>Level {member.level}</Text>
            <Text style={styles.memberPubgId}>{member.pubgId}</Text>
          </View>
        )}
      </View>
    )

    return (
      <View style={styles.container}>
        <StatusBar backgroundColor="#000000" barStyle="light-content" />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Icon name="people" size={24} color="#22c55e" />
            <Text style={styles.headerTitle}>Squad Management</Text>
          </View>

          <View style={styles.membersBadge}>
            <Text style={styles.membersText}>{squadMembers.filter((m) => m.status !== "empty").length}/4 Members</Text>
          </View>
        </View>

        <ScrollView style={styles.content}>
          {/* Squad Status Card */}
          <View style={styles.squadCard}>
            <LinearGradient colors={["#22c55e20", "#16a34a10"]} style={styles.squadCardGradient}>
              <View style={styles.squadHeader}>
                <View style={styles.squadTitleContainer}>
                  <IconCommunity name="shield" size={20} color="#22c55e" />
                  <Text style={styles.squadTitle}>Alpha Squad</Text>
                </View>
                <View style={styles.rankBadge}>
                  <IconCommunity name="crown" size={12} color="#fbbf24" />
                  <Text style={styles.rankText}>Rank #12</Text>
                </View>
              </View>

              <View style={styles.squadStats}>
                <View style={styles.squadStatItem}>
                  <Text style={styles.squadStatNumber}>28</Text>
                  <Text style={styles.squadStatLabel}>Matches Won</Text>
                </View>
                <View style={styles.squadStatItem}>
                  <Text style={styles.squadStatNumber}>342</Text>
                  <Text style={styles.squadStatLabel}>Total Kills</Text>
                </View>
              </View>

              {/* Squad Members Grid */}
              <View style={styles.squadMembersGrid}>
                {squadMembers.map((member, index) => renderSquadMember(member, index))}
              </View>

              <View style={styles.squadActions}>
                <TouchableOpacity style={styles.inviteFriendsButton}>
                  <LinearGradient colors={["#22c55e", "#16a34a"]} style={styles.inviteFriendsGradient}>
                    <Icon name="person-add" size={16} color="#000000" />
                    <Text style={styles.inviteFriendsText}>Invite Friends</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity style={styles.shareButton}>
                  <Icon name="share" size={20} color="#22c55e" />
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsCard}>
            <Text style={styles.cardTitle}>Quick Actions</Text>

            <TouchableOpacity style={styles.quickActionButton}>
              <LinearGradient colors={["#3b82f6", "#2563eb"]} style={styles.quickActionGradient}>
                <Icon name="people" size={20} color="#ffffff" />
                <Text style={styles.quickActionText}>Create New Squad</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionButtonOutline}>
              <IconCommunity name="flash" size={20} color="#fbbf24" />
              <Text style={styles.quickActionTextOutline}>Random Matchmaking</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionButtonOutline}>
              <Icon name="search" size={20} color="#a855f7" />
              <Text style={styles.quickActionTextOutline}>Find Squad</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <BottomNavigation />
      </View>
    )
  }

  // Wallet Screen Component
  const WalletScreen = () => {
    const transactions = [
      {
        id: 1,
        type: "win",
        amount: 3000,
        description: "Championship Battle - 1st Place",
        time: "2 hours ago",
        status: "completed",
      },
      {
        id: 2,
        type: "entry",
        amount: -100,
        description: "Elite Squad Wars - Entry Fee",
        time: "4 hours ago",
        status: "completed",
      },
      {
        id: 3,
        type: "deposit",
        amount: 500,
        description: "UPI Deposit - PhonePe",
        time: "1 day ago",
        status: "completed",
      },
    ]

    const renderTransaction = ({ item }) => (
      <View style={styles.transactionItem}>
        <View
          style={[
            styles.transactionIcon,
            {
              backgroundColor:
                item.type === "win"
                  ? "#22c55e20"
                  : item.type === "entry"
                    ? "#ef444420"
                    : item.type === "deposit"
                      ? "#3b82f620"
                      : "#fbbf2420",
            },
          ]}
        >
          <Icon
            name={
              item.type === "win"
                ? "emoji-events"
                : item.type === "entry"
                  ? "sports-esports"
                  : item.type === "deposit"
                    ? "add"
                    : "remove"
            }
            size={20}
            color={
              item.type === "win"
                ? "#22c55e"
                : item.type === "entry"
                  ? "#ef4444"
                  : item.type === "deposit"
                    ? "#3b82f6"
                    : "#fbbf24"
            }
          />
        </View>

        <View style={styles.transactionDetails}>
          <Text style={styles.transactionDescription}>{item.description}</Text>
          <View style={styles.transactionMeta}>
            <Text style={styles.transactionTime}>{item.time}</Text>
            <View
              style={[
                styles.transactionStatus,
                { backgroundColor: item.status === "completed" ? "#22c55e20" : "#fbbf2420" },
              ]}
            >
              <Text
                style={[styles.transactionStatusText, { color: item.status === "completed" ? "#22c55e" : "#fbbf24" }]}
              >
                {item.status}
              </Text>
            </View>
          </View>
        </View>

        <Text style={[styles.transactionAmount, { color: item.amount > 0 ? "#22c55e" : "#ef4444" }]}>
          {item.amount > 0 ? "+" : ""}₹{Math.abs(item.amount).toLocaleString()}
        </Text>
      </View>
    )

    return (
      <View style={styles.container}>
        <StatusBar backgroundColor="#000000" barStyle="light-content" />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Icon name="account-balance-wallet" size={24} color="#22c55e" />
            <Text style={styles.headerTitle}>Wallet</Text>
          </View>

          <TouchableOpacity>
            <Icon name="history" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Balance Card */}
          <View style={styles.balanceCard}>
            <LinearGradient colors={["#22c55e40", "#16a34a20"]} style={styles.balanceCardGradient}>
              <Text style={styles.balanceAmount}>₹{walletBalance.toLocaleString()}</Text>
              <Text style={styles.balanceLabel}>Available Balance</Text>

              <View style={styles.instantWithdrawals}>
                <View style={styles.liveDot} />
                <Text style={styles.instantText}>Instant Withdrawals</Text>
              </View>

              <View style={styles.walletActions}>
                <TouchableOpacity style={styles.addMoneyButton}>
                  <LinearGradient colors={["#22c55e", "#16a34a"]} style={styles.addMoneyGradient}>
                    <Icon name="add" size={16} color="#000000" />
                    <Text style={styles.addMoneyText}>Add Money</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity style={styles.withdrawButton}>
                  <Icon name="remove" size={16} color="#22c55e" />
                  <Text style={styles.withdrawText}>Withdraw</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>

          {/* Quick Stats */}
          <View style={styles.walletStatsContainer}>
            <View style={styles.walletStatCard}>
              <Icon name="trending-up" size={24} color="#22c55e" />
              <Text style={styles.walletStatNumber}>₹12,450</Text>
              <Text style={styles.walletStatLabel}>Total Winnings</Text>
            </View>

            <View style={styles.walletStatCard}>
              <IconCommunity name="target" size={24} color="#ef4444" />
              <Text style={styles.walletStatNumber}>₹2,100</Text>
              <Text style={styles.walletStatLabel}>Total Spent</Text>
            </View>

            <View style={styles.walletStatCard}>
              <Icon name="emoji-events" size={24} color="#3b82f6" />
              <Text style={styles.walletStatNumber}>28</Text>
              <Text style={styles.walletStatLabel}>Matches Won</Text>
            </View>
          </View>

          {/* Transaction History */}
          <View style={styles.transactionCard}>
            <View style={styles.transactionHeader}>
              <Text style={styles.cardTitle}>Transaction History</Text>
              <TouchableOpacity>
                <Icon name="filter-list" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={transactions}
              renderItem={renderTransaction}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </ScrollView>

        <BottomNavigation />
      </View>
    )
  }

  // Bottom Navigation Component
  const BottomNavigation = () => {
    const navItems = [
      { icon: "home", label: "Home", screen: "home" },
      { icon: "people", label: "Squad", screen: "squad" },
      { icon: "sports-esports", label: "Matches", screen: "matches" },
      { icon: "emoji-events", label: "Leaderboard", screen: "leaderboard" },
      { icon: "settings", label: "Settings", screen: "settings" },
    ]

    return (
      <View style={styles.bottomNav}>
        <LinearGradient colors={["#000000f0", "#000000"]} style={styles.bottomNavGradient}>
          {navItems.map((item) => (
            <TouchableOpacity
              key={item.screen}
              style={[styles.navItem, currentScreen === item.screen && styles.navItemActive]}
              onPress={() => setCurrentScreen(item.screen)}
            >
              <Icon name={item.icon} size={20} color={currentScreen === item.screen ? "#22c55e" : "#6b7280"} />
              <Text style={[styles.navLabel, currentScreen === item.screen && styles.navLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </LinearGradient>
      </View>
    )
  }

  // Main App Router
  if (!isLoggedIn) {
    return <LoginScreen />
  }

  switch (currentScreen) {
    case "home":
      return <HomeScreen />
    case "squad":
      return <SquadScreen />
    case "wallet":
      return <WalletScreen />
    case "matches":
      return <HomeScreen /> // Placeholder
    case "leaderboard":
      return <HomeScreen /> // Placeholder
    case "live":
      return <HomeScreen /> // Placeholder
    case "settings":
      return <HomeScreen /> // Placeholder
    default:
      return <HomeScreen />
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  backgroundGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  titleGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#000000",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    marginTop: 8,
    textAlign: "center",
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22c55e",
    marginRight: 8,
  },
  liveText: {
    fontSize: 14,
    color: "#22c55e",
    fontWeight: "600",
  },
  loginCard: {
    backgroundColor: "#1f2937",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#22c55e40",
    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#22c55e",
    textAlign: "center",
    marginBottom: 24,
  },
  formContainer: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#00000080",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#374151",
    paddingHorizontal: 16,
    height: 48,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    color: "#ffffff",
    fontSize: 16,
  },
  primaryButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  primaryButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#3b82f680",
    backgroundColor: "transparent",
    gap: 8,
  },
  secondaryButtonText: {
    color: "#3b82f6",
    fontSize: 16,
    fontWeight: "600",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#374151",
  },
  dividerText: {
    color: "#6b7280",
    fontSize: 12,
    paddingHorizontal: 12,
    textTransform: "uppercase",
  },
  otpDescription: {
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 16,
  },
  otpInput: {
    backgroundColor: "#00000080",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#374151",
    paddingVertical: 16,
    fontSize: 24,
    color: "#ffffff",
    textAlign: "center",
    letterSpacing: 8,
  },
  linkText: {
    color: "#6b7280",
    textAlign: "center",
    marginTop: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#000000f0",
    borderBottomWidth: 1,
    borderBottomColor: "#22c55e40",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerText: {
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#22c55e",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  walletBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#22c55e20",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#22c55e40",
    gap: 4,
  },
  walletText: {
    color: "#22c55e",
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginVertical: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  statCardGradient: {
    alignItems: "center",
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "#22c55e40",
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  liveBanner: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
  },
  liveBannerGradient: {
    borderWidth: 1,
    borderColor: "#ef444440",
  },
  liveBannerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  liveBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  livePulse: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#ef4444",
  },
  liveBannerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ef4444",
  },
  liveBannerSubtitle: {
    fontSize: 14,
    color: "#d1d5db",
    marginTop: 2,
  },
  watchButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ef4444",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  watchButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#22c55e",
  },
  availableBadge: {
    backgroundColor: "#22c55e20",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#22c55e40",
  },
  availableText: {
    color: "#22c55e",
    fontSize: 12,
    fontWeight: "600",
  },
  matchCard: {
    backgroundColor: "#1f2937",
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#22c55e40",
    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  matchHeader: {
    flexDirection: "row",
    padding: 16,
    gap: 16,
  },
  matchImageContainer: {
    position: "relative",
  },
  matchImage: {
    width: 80,
    height: 80,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  timeLeftBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ef4444",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 2,
  },
  timeLeftText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "600",
  },
  matchInfo: {
    flex: 1,
  },
  matchTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  matchTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#22c55e",
    flex: 1,
  },
  mapBadge: {
    backgroundColor: "#3b82f620",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#3b82f640",
  },
  mapText: {
    color: "#3b82f6",
    fontSize: 12,
    fontWeight: "600",
  },
  matchStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    color: "#d1d5db",
    fontSize: 14,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#374151",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  matchActions: {
    flexDirection: "row",
    gap: 8,
  },
  joinButton: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  joinButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 8,
  },
  joinButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "600",
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#22c55e80",
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  squadCard: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 16,
    marginBottom: 24,
  },
  squadCardGradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: "#22c55e40",
  },
  squadHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  squadTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  squadTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#22c55e",
  },
  rankBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fbbf2420",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#fbbf2440",
    gap: 4,
  },
  rankText: {
    color: "#fbbf24",
    fontSize: 12,
    fontWeight: "600",
  },
  squadStats: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  squadStatItem: {
    alignItems: "center",
  },
  squadStatNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#22c55e",
  },
  squadStatLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  squadMembersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 16,
  },
  squadMemberContainer: {
    width: (width - 80) / 2,
    alignItems: "center",
  },
  emptySlot: {
    alignItems: "center",
  },
  emptySlotCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: "#6b7280",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  emptySlotText: {
    color: "#6b7280",
    fontSize: 14,
    marginBottom: 8,
  },
  inviteButton: {
    backgroundColor: "#22c55e",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  inviteButtonText: {
    color: "#000000",
    fontSize: 12,
    fontWeight: "600",
  },
  squadMember: {
    alignItems: "center",
    position: "relative",
  },
  memberAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#374151",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "#22c55e40",
    position: "relative",
  },
  memberAvatarText: {
    color: "#22c55e",
    fontSize: 24,
    fontWeight: "bold",
  },
  statusIndicator: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#000000",
  },
  crownIcon: {
    position: "absolute",
    top: -8,
    left: "50%",
    marginLeft: -8,
  },
  memberName: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  memberLevel: {
    color: "#6b7280",
    fontSize: 12,
    marginTop: 2,
  },
  memberPubgId: {
    color: "#22c55e",
    fontSize: 12,
    marginTop: 2,
  },
  squadActions: {
    flexDirection: "row",
    gap: 8,
  },
  inviteFriendsButton: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  inviteFriendsGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 8,
  },
  inviteFriendsText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "600",
  },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#22c55e80",
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  quickActionsCard: {
    backgroundColor: "#1f2937",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#22c55e40",
    gap: 12,
  },
  quickActionButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  quickActionGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  quickActionText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  quickActionButtonOutline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#6b728080",
    backgroundColor: "transparent",
    gap: 8,
  },
  quickActionTextOutline: {
    color: "#d1d5db",
    fontSize: 16,
    fontWeight: "600",
  },
  membersBadge: {
    backgroundColor: "#22c55e20",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#22c55e40",
  },
  membersText: {
    color: "#22c55e",
    fontSize: 14,
    fontWeight: "600",
  },
  balanceCard: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 16,
    marginBottom: 24,
  },
  balanceCardGradient: {
    alignItems: "center",
    padding: 24,
    borderWidth: 1,
    borderColor: "#22c55e60",
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#22c55e",
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 8,
  },
  instantWithdrawals: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 8,
  },
  instantText: {
    color: "#22c55e",
    fontSize: 14,
  },
  walletActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  addMoneyButton: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  addMoneyGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  addMoneyText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "600",
  },
  withdrawButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#22c55e80",
    backgroundColor: "transparent",
    gap: 8,
  },
  withdrawText: {
    color: "#22c55e",
    fontSize: 16,
    fontWeight: "600",
  },
  walletStatsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  walletStatCard: {
    flex: 1,
    backgroundColor: "#1f2937",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#22c55e40",
  },
  walletStatNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginTop: 8,
  },
  walletStatLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  transactionCard: {
    backgroundColor: "#1f2937",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#22c55e40",
  },
  transactionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#37415180",
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#37415180",
    gap: 12,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  transactionMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  transactionTime: {
    color: "#6b7280",
    fontSize: 12,
  },
  transactionStatus: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
  },
  transactionStatusText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "bold",
  },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: "#22c55e40",
  },
  bottomNavGradient: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 12,
  },
  navItemActive: {
    backgroundColor: "#22c55e20",
  },
  navLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
    fontWeight: "600",
  },
  navLabelActive: {
    color: "#22c55e",
  },
})

export default App
