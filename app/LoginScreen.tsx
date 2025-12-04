"use client";

import React, { useEffect, useState } from "react";
import { authService } from "./services/authService";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Target, Phone, Send, Mail, Gamepad2, CheckCircle, Shield, Lock, Eye, EyeOff, User } from "lucide-react";

export type Screen =
  | "login"
  | "home"
  | "squad"
  | "wallet"
  | "matches"
  | "leaderboard"
  | "live"
  | "settings"
  | "profile";

type Props = {
  setIsLoggedIn?: React.Dispatch<React.SetStateAction<boolean>>;
  setCurrentScreen?: (s: Screen) => void;
  setUserRole?: React.Dispatch<React.SetStateAction<"user" | "admin">>;
};

type ApiUser = {
  _id?: string;
  phone?: string;
  email?: string;
  pubgId?: string;
  role?: "user" | "admin";
  adminEmail?: string;
};

function extractUser(payload: any): ApiUser | null {
  if (!payload) return null;
  if (payload.user) return payload.user;
  if (payload.data?.user) return payload.data.user;
  if (payload.exists && payload.user) return payload.user;
  if (payload.phone) return payload as ApiUser;
  return null;
}

type AuthMode = "login" | "register" | "admin";

export default function LoginScreen({ setIsLoggedIn, setCurrentScreen, setUserRole }: Props) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [step, setStep] = useState<"phone" | "otp" | "registerDetails">("phone");

  // User registration states
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [pubgId, setPubgId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");

  // Admin inputs
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminLoggingIn, setAdminLoggingIn] = useState(false);

  // UI state
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Reset flow when switching tabs
  const onSwitchMode = (m: AuthMode) => {
    setMode(m);
    setStep("phone");
    setErrorMsg(null);
    setSuccessMsg(null);

    if (m === "login") {
      setPhoneNumber("");
      setOtp("");
      setVerificationId(null);
      setResendTimer(0);
      setPubgId("");
      setEmail("");
      setPassword("");
      setName("");
    } else if (m === "register") {
      setPhoneNumber("");
      setOtp("");
      setVerificationId(null);
      setResendTimer(0);
      setPubgId("");
      setEmail("");
      setPassword("");
      setName("");
    } else if (m === "admin") {
      setAdminEmail("");
      setAdminPassword("");
      setShowAdminPassword(false);
    }
  };

  const humanizeAxiosError = (err: any): string => {
    const status = err?.response?.status;
    const msg = err?.response?.data?.error || err?.response?.data?.message || err?.message;

    // For admin login, provide more specific error messages
    if (status === 401) {
      if (mode === "admin") {
        return "Invalid admin email or password. Please check your credentials.";
      }
      return "Authentication failed. Please try again.";
    }
    if (status === 429) return "Too many attempts. Please wait a minute and try again.";
    if (status === 400) return msg || "Invalid request. Please check your input.";
    if (status === 500) return "Server error. Please try again later.";
    return msg || "Something went wrong. Please try again.";
  };

  const sendOtp = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (phoneNumber.length < 10) {
      setErrorMsg("Enter a valid 10-digit phone number");
      return;
    }

    setSending(true);
    try {
      const res = await authService.sendOtp({
        countryCode: "91",
        mobileNumber: phoneNumber,
        flowType: "SMS",
        otpLength: 6,
      });

      const payload = res.verificationId ? res : res.data || {};
      if (!payload?.verificationId) throw new Error("Missing verificationId from server");

      setVerificationId(String(payload.verificationId));
      setStep("otp");
      setResendTimer(Number(payload.timeout || 60));
      setSuccessMsg("OTP sent successfully! Check your phone.");
    } catch (err: any) {
      setErrorMsg(humanizeAxiosError(err));
    } finally {
      setSending(false);
    }
  };

  const verifyOtp = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!verificationId) {
      setErrorMsg("Session expired. Please resend OTP.");
      return;
    }
    if (!otp || otp.replace(/\D/g, "").length < 4) {
      setErrorMsg("Enter the OTP");
      return;
    }

    setVerifying(true);
    try {
      await authService.verifyOtp({
        verificationId,
        code: otp.replace(/\D/g, "")
      });

      // OTP verified successfully, proceed to registration details
      setStep("registerDetails");
      setSuccessMsg("Phone number verified! Please complete your registration.");
    } catch (err: any) {
      setErrorMsg(humanizeAxiosError(err));
    } finally {
      setVerifying(false);
    }
  };

  // Resend timer countdown
  useEffect(() => {
    if (step !== "otp" || resendTimer <= 0) return;
    const t = setInterval(() => setResendTimer((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [step, resendTimer]);

  const persistAndEnter = (user: ApiUser, token?: string) => {
    try {
      localStorage.setItem("user", JSON.stringify(user));
      if (token) {
        localStorage.setItem("token", token);
      }
    } catch { }
    setIsLoggedIn?.(true);
    if (user.role && setUserRole) {
      setUserRole(user.role);
    }
    setCurrentScreen?.("home");
  };

  const completeRegistration = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!verificationId) {
      setErrorMsg("Please verify your phone number first");
      return;
    }
    if (phoneNumber.length < 10) {
      setErrorMsg("Phone number must be at least 10 digits");
      return;
    }
    if (!pubgId.trim()) {
      setErrorMsg("PUBG In-Game ID is required");
      return;
    }
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      setErrorMsg("Valid email is required");
      return;
    }
    if (!password.trim()) {
      setErrorMsg("Password is required");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters");
      return;
    }
    if (!name.trim()) {
      setErrorMsg("Full name is required");
      return;
    }

    setRegistering(true);
    try {
      const res = await authService.register({
        phone: phoneNumber,
        pubgId,
        email,
        password,
        name,
      });

      if (res.success) {
        // ✅ Registration success — switch to Login tab and reset
        setSuccessMsg("Registration successful! Please log in with your email and password.");
        setMode("login");
        setStep("phone");
        setPhoneNumber("");
        setOtp("");
        setVerificationId(null);
        setResendTimer(0);
        setPubgId("");
        setEmail("");
        setPassword("");
        setName("");
      } else {
        setErrorMsg(res.error || "Registration failed");
      }
    } catch (err: any) {
      setErrorMsg(humanizeAxiosError(err));
    } finally {
      setRegistering(false);
    }
  };

  // Admin login function
  const handleAdminLogin = async () => {
    if (!adminEmail || !adminPassword) {
      setErrorMsg("Please enter both email and password");
      return;
    }

    setAdminLoggingIn(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    console.log("Attempting admin login with:", { email: adminEmail, password: "***" });

    try {
      const response = await authService.adminLogin({
        email: adminEmail,
        password: adminPassword,
      });

      console.log("Admin login response:", response);

      if (response.success && response.user) {
        const user = response.user;

        console.log("Admin login successful, user:", user);

        // Store admin user and token
        persistAndEnter(user, response.token);

        setSuccessMsg("Admin login successful!");
      } else {
        setErrorMsg("Admin login failed. Please check your credentials.");
      }
    } catch (error: any) {
      console.error("Admin login error:", error);

      // Provide specific error message for admin login
      if (error?.response?.status === 401) {
        setErrorMsg("Invalid admin email or password. Please check your credentials.");
      } else if (error?.code === 'ECONNREFUSED' || error?.code === 'ERR_NETWORK') {
        setErrorMsg("Cannot connect to server. Please check if the server is running on port 5050.");
      } else {
        setErrorMsg(humanizeAxiosError(error));
      }
    } finally {
      setAdminLoggingIn(false);
    }
  };

  const handleLogin = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim()) {
      setErrorMsg("Email is required");
      return;
    }
    if (!password.trim()) {
      setErrorMsg("Password is required");
      return;
    }

    setVerifying(true);
    try {
      const loginRes = await authService.login({
        email: email.trim().toLowerCase(),
        password,
      });

      const authedUser = extractUser(loginRes);
      if (authedUser) {
        persistAndEnter(authedUser, loginRes.token); // → Home
      } else {
        setErrorMsg("Invalid response from server");
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setErrorMsg("No account found for this email. Please register.");
      } else {
        setErrorMsg(humanizeAxiosError(err));
      }
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-gray-900/80 backdrop-blur-sm border-green-500/30 shadow-2xl shadow-green-500/20">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center mb-4">
              <Target className="w-12 h-12 text-green-400 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-green-400">PUBG Arena</h1>
                <p className="text-sm text-gray-400">Tournament Platform</p>
              </div>
            </div>

            {/* Auth Mode Tabs */}
            <div className="flex bg-gray-800 rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                className={`flex-1 ${mode === "login" ? "bg-green-500 text-black" : "text-gray-400 hover:text-green-400"}`}
                onClick={() => onSwitchMode("login")}
              >
                <Phone className="w-4 h-4 mr-2" />
                User Login
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`flex-1 ${mode === "register" ? "bg-green-500 text-black" : "text-gray-400 hover:text-green-400"}`}
                onClick={() => onSwitchMode("register")}
              >
                <Gamepad2 className="w-4 h-4 mr-2" />
                Register
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`flex-1 ${mode === "admin" ? "bg-red-500 text-black" : "text-gray-400 hover:text-red-400"}`}
                onClick={() => onSwitchMode("admin")}
              >
                <Shield className="w-4 h-4 mr-2" />
                Admin
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Error/Success Messages */}
            {errorMsg && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 text-sm">
                {successMsg}
              </div>
            )}

            {/* ADMIN LOGIN */}
            {mode === "admin" && (
              <div className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-red-400" />
                  <Input
                    placeholder="Admin Email"
                    className="pl-12 bg-black/50 border-gray-700 text-white placeholder-gray-500 focus:border-red-500 focus:ring-red-500/20 h-12"
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-red-400" />
                  <Input
                    placeholder="Admin Password"
                    className="pl-12 pr-12 bg-black/50 border-gray-700 text-white placeholder-gray-500 focus:border-red-500 focus:ring-red-500/20 h-12"
                    type={showAdminPassword ? "text" : "password"}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2.5 h-7 w-7 p-0 text-gray-400 hover:text-red-400"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                  >
                    {showAdminPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Button
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold h-12 shadow-lg shadow-red-500/30"
                  onClick={handleAdminLogin}
                  disabled={adminLoggingIn}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  {adminLoggingIn ? "Logging in..." : "Admin Login"}
                </Button>
              </div>
            )}

            {/* USER LOGIN/REGISTER */}
            {mode !== "admin" && (
              <>
                {/* USER LOGIN */}
                {mode === "login" && (
                  <div className="space-y-4">
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-5 h-5 text-green-400" />
                      <Input
                        placeholder="Email Address"
                        className="pl-12 bg-black/50 border-gray-700 text-white placeholder-gray-500 focus:border-green-500 focus:ring-green-500/20 h-12"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-5 h-5 text-green-400" />
                      <Input
                        placeholder="Password"
                        className="pl-12 pr-12 bg-black/50 border-gray-700 text-white placeholder-gray-500 focus:border-green-500 focus:ring-green-500/20 h-12"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-2.5 h-7 w-7 p-0 text-gray-400 hover:text-green-400"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <Button
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-black font-semibold h-12 shadow-lg shadow-green-500/30"
                      onClick={handleLogin}
                      disabled={verifying}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {verifying ? "Logging in..." : "Login"}
                    </Button>
                  </div>
                )}

                {/* USER REGISTRATION */}
                {mode === "register" && (
                  <div className="space-y-4">
                    {step === "phone" && (
                      <div className="space-y-4">
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 w-5 h-5 text-blue-400" />
                          <Input
                            placeholder="Phone Number (Required)"
                            className="pl-12 bg-black/50 border-gray-700 text-white placeholder-blue-500 focus:border-blue-500 focus:ring-blue-500/20 h-12"
                            type="tel"
                            inputMode="numeric"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                          />
                        </div>
                        <Button
                          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold h-12 shadow-lg shadow-blue-500/30"
                          onClick={sendOtp}
                          disabled={sending}
                        >
                          <Send className="w-4 h-4 mr-2" />
                          {sending ? "Sending..." : "Send OTP"}
                        </Button>
                      </div>
                    )}

                    {step === "otp" && (
                      <div className="space-y-4">
                        <p className="text-center text-gray-400">Enter the 6-digit OTP sent to {phoneNumber}</p>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 w-5 h-5 text-blue-400" />
                          <Input
                            placeholder="Enter OTP"
                            className="pl-12 text-center text-2xl tracking-widest bg-black/50 border-gray-700 text-white placeholder-blue-500 focus:border-blue-500 focus:ring-blue-500/20 h-12"
                            type="text"
                            maxLength={6}
                            inputMode="numeric"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                          />
                        </div>
                        <Button
                          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold h-12 shadow-lg shadow-blue-500/30"
                          onClick={verifyOtp}
                          disabled={verifying}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          {verifying ? "Verifying..." : "Verify OTP"}
                        </Button>

                        <div className="flex items-center justify-between">
                          <Button
                            variant="ghost"
                            className="text-gray-400 hover:text-blue-400"
                            onClick={() => setStep("phone")}
                          >
                            Change Phone Number
                          </Button>
                          {resendTimer > 0 ? (
                            <p className="text-sm text-gray-400">Resend in {resendTimer}s</p>
                          ) : (
                            <Button
                              variant="outline"
                              className="border-blue-500/50 text-blue-400 bg-transparent"
                              onClick={sendOtp}
                              disabled={sending}
                            >
                              <Send className="w-4 h-4 mr-2" />
                              Resend OTP
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    {step === "registerDetails" && (
                      <div className="space-y-4">
                        <div className="relative">
                          <User className="absolute left-3 top-3 w-5 h-5 text-green-400" />
                          <Input
                            placeholder="Full Name (Required)"
                            className="pl-12 bg-black/50 border-gray-700 text-white placeholder-gray-500 focus:border-green-500 h-12"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                          />
                        </div>
                        <div className="relative">
                          <Gamepad2 className="absolute left-3 top-3 w-5 h-5 text-green-400" />
                          <Input
                            placeholder="PUBG In-Game ID (Required)"
                            className="pl-12 bg-black/50 border-gray-700 text-white placeholder-gray-500 focus:border-green-500 h-12"
                            value={pubgId}
                            onChange={(e) => setPubgId(e.target.value)}
                          />
                        </div>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 w-5 h-5 text-blue-400" />
                          <Input
                            placeholder="Email Address (Required)"
                            className="pl-12 bg-black/50 border-gray-700 text-white placeholder-blue-500 focus:ring-blue-500/20 h-12"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 w-5 h-5 text-blue-400" />
                          <Input
                            placeholder="Password (Required)"
                            className="pl-12 pr-12 bg-black/50 border-gray-700 text-white placeholder-blue-500 focus:ring-blue-500/20 h-12"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-2.5 h-7 w-7 p-0 text-gray-400 hover:text-blue-400"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <Button
                          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-black font-semibold h-12"
                          onClick={completeRegistration}
                          disabled={registering}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          {registering ? "Saving..." : "Complete Registration"}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
