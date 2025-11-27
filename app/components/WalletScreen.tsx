"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Wallet,
  Plus,
  History,
  LogOut,
  Home,
  Users,
  Gamepad2,
  Trophy,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown
} from "lucide-react";

const API_BASE = "http://localhost:5050/api";

export default function WalletScreen({ onLogout, onNavigate }: {
  onLogout: () => void;
  onNavigate?: (screen: "home" | "squad" | "wallet" | "matches" | "leaderboard" | "live" | "settings") => void
}) {
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [amount, setAmount] = useState("");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "transactions" | "addMoney">("overview");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState("");

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

  const loadWallet = async () => {
    setLoading(true);
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        console.log('No current user found, cannot load wallet');
        setLoading(false);
        return;
      }

      console.log('Loading wallet for user:', currentUser._id);

      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/wallet/my-wallet`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Wallet response:', response.data);

      if (response.data.success) {
        setWallet(response.data.data);
      } else {
        console.log('Wallet not found, creating new wallet');
        await createWallet();
      }
    } catch (error: any) {
      console.error('Error loading wallet:', error);
      if (error.response?.status === 404) {
        await createWallet();
      }
    } finally {
      setLoading(false);
    }
  };

  const createWallet = async () => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) return;

      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE}/wallet`, {
        // userId is REMOVED. Server gets it from token.
        userName: currentUser.name,
        userEmail: currentUser.email
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setWallet(response.data.data);
      }
    } catch (error: any) {
      console.error('Error creating wallet:', error);
    }
  };

  const loadTransactions = async () => {
    if (!wallet) return;

    setTransactionsLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/wallet/${wallet._id}/transactions`);
      if (response.data.success) {
        setTransactions(response.data.data);
      }
    } catch (error: any) {
      console.error('Error loading transactions:', error);
    } finally {
      setTransactionsLoading(false);
    }
  };

  const initiateAddMoney = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      showToast("Please enter a valid amount", "error");
      return;
    }

    setPaymentLoading(true);
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) return;

      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE}/wallet/add-money`, {
        amount: parseFloat(amount),
        userEmail: currentUser.email,
        userPhone: currentUser.phone
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setPaymentUrl(response.data.paymentUrl);
        setShowAddMoney(false);
        // Open payment URL in new tab
        window.open(response.data.paymentUrl, '_blank');
        showToast("Payment initiated! Please complete the payment.", "success");
        // Refresh wallet after a delay
        setTimeout(() => {
          loadWallet();
          loadTransactions();
        }, 5000);
      }
    } catch (error: any) {
      showToast(error.response?.data?.error || "Failed to initiate payment", "error");
    } finally {
      setPaymentLoading(false);
    }
  };

  const showToast = (message: string, type: "success" | "error" = "success") => {
    alert(`${type === "success" ? "✅" : "❌"} ${message}`);
  };

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      loadWallet();
    }
  }, []);

  useEffect(() => {
    if (wallet && activeTab === "transactions") {
      loadTransactions();
    }
  }, [wallet, activeTab]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Loading wallet...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'credit':
        return <TrendingUp className="w-5 h-5 text-green-400" />;
      case 'debit':
        return <TrendingDown className="w-5 h-5 text-red-400" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-400" />;
    }
  };

  const getTransactionStatus = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Success</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Failed</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="sticky top-0 bg-black/95 backdrop-blur-sm border-b border-green-500/20 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-green-400 flex items-center">
            <Wallet className="w-6 h-6 mr-2" />
            Wallet
          </h1>
          <Button size="sm" variant="ghost" onClick={onLogout} className="text-red-400">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Wallet Overview Card */}
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/30">
          <CardHeader>
            <CardTitle className="text-green-400 flex items-center justify-between">
              <span className="flex items-center">
                <Wallet className="w-5 h-5 mr-2" />
                Wallet Balance
              </span>
              <Button
                size="sm"
                onClick={() => setShowAddMoney(true)}
                className="bg-green-500 hover:bg-green-600 text-black"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Money
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-400 mb-2">
                {wallet ? formatCurrency(wallet.balance) : formatCurrency(0)}
              </div>
              <p className="text-gray-400 text-sm">
                Available for matches and withdrawals
              </p>
            </div>

            {wallet && (
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-400">{wallet.totalDeposits || 0}</p>
                  <p className="text-sm text-gray-400">Total Deposits</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-400">{wallet.totalWithdrawals || 0}</p>
                  <p className="text-sm text-gray-400">Total Withdrawals</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "overview" | "transactions" | "addMoney")} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-900 border-green-500/20">
            <TabsTrigger value="overview" className="data-[state=active]:bg-green-500 data-[state=active]:text-black">
              Overview
            </TabsTrigger>
            <TabsTrigger value="transactions" className="data-[state=active]:bg-green-500 data-[state=active]:text-black">
              Transactions
            </TabsTrigger>
            <TabsTrigger value="addMoney" className="data-[state=active]:bg-green-500 data-[state=active]:text-black">
              Add Money
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card className="bg-gray-900 border-green-500/20">
                <CardHeader>
                  <CardTitle className="text-green-400">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  {transactions.length > 0 ? (
                    <div className="space-y-3">
                      {transactions.slice(0, 3).map((transaction) => (
                        <div key={transaction._id} className="flex items-center justify-between p-2 bg-gray-800 rounded">
                          <div className="flex items-center space-x-3">
                            {getTransactionIcon(transaction.type)}
                            <div>
                              <p className="text-sm font-medium">{transaction.description}</p>
                              <p className="text-xs text-gray-400">{formatDate(transaction.createdAt)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-bold ${transaction.type === 'credit' ? 'text-green-400' : 'text-red-400'}`}>
                              {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                            </p>
                            {getTransactionStatus(transaction.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-center py-4">No recent transactions</p>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-gray-900 border-green-500/20">
                <CardHeader>
                  <CardTitle className="text-green-400">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    className="w-full bg-green-500 hover:bg-green-600 text-black"
                    onClick={() => setShowAddMoney(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Money
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-blue-500/50 text-blue-400 bg-transparent hover:bg-blue-500/10"
                    onClick={() => setActiveTab("transactions")}
                  >
                    <History className="w-4 h-4 mr-2" />
                    View All Transactions
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6 mt-4">
            <Card className="bg-gray-900 border-green-500/20">
              <CardHeader>
                <CardTitle className="text-green-400 flex items-center justify-between">
                  <span>Transaction History</span>
                  <Button
                    size="sm"
                    onClick={loadTransactions}
                    disabled={transactionsLoading}
                    className="bg-green-500 hover:bg-green-600 text-black"
                  >
                    <History className="w-4 h-4 mr-2" />
                    {transactionsLoading ? 'Loading...' : 'Refresh'}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {transactionsLoading ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400">Loading transactions...</p>
                  </div>
                ) : transactions.length > 0 ? (
                  <div className="space-y-3">
                    {transactions.map((transaction) => (
                      <div key={transaction._id} className="flex items-center justify-between p-4 bg-gray-800 rounded border border-gray-700">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                            {getTransactionIcon(transaction.type)}
                          </div>
                          <div>
                            <p className="font-medium">{transaction.description}</p>
                            <p className="text-sm text-gray-400">{formatDate(transaction.createdAt)}</p>
                            {transaction.referenceId && (
                              <p className="text-xs text-gray-500">Ref: {transaction.referenceId}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${transaction.type === 'credit' ? 'text-green-400' : 'text-red-400'}`}>
                            {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </p>
                          {getTransactionStatus(transaction.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <p>No transactions found</p>
                    <p className="text-sm mt-2">Start by adding money to your wallet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="addMoney" className="space-y-6 mt-4">
            <Card className="bg-gray-900 border-green-500/20">
              <CardHeader>
                <CardTitle className="text-green-400">Add Money to Wallet</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="w-10 h-10 text-green-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Secure Payment Gateway</h3>
                  <p className="text-gray-400 text-sm">
                    Add money to your wallet using our secure payment gateway powered by Cashfree
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Amount (₹)
                    </label>
                    <Input
                      type="number"
                      placeholder="Enter amount (min: ₹100)"
                      className="bg-black border-gray-700 text-white text-lg text-center"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min="100"
                      step="100"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Minimum amount: ₹100 | Maximum amount: ₹50,000
                    </p>
                  </div>

                  <Button
                    className="w-full bg-green-500 hover:bg-green-600 text-black text-lg py-3"
                    onClick={initiateAddMoney}
                    disabled={!amount || parseFloat(amount) < 100 || parseFloat(amount) > 50000 || paymentLoading}
                  >
                    {paymentLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5 mr-2" />
                        Add ₹{amount || '0'} to Wallet
                      </>
                    )}
                  </Button>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <h4 className="font-medium text-blue-400 mb-2">Payment Process</h4>
                  <ol className="text-sm text-blue-300 space-y-1">
                    <li>1. Enter the amount you want to add</li>
                    <li>2. Click "Add Money" to proceed to payment</li>
                    <li>3. Complete payment on Cashfree's secure gateway</li>
                    <li>4. Money will be added to your wallet instantly</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Money Dialog */}
      <Dialog open={showAddMoney} onOpenChange={setShowAddMoney}>
        <DialogContent className="bg-gray-900 border-green-500/30">
          <DialogHeader>
            <DialogTitle className="text-green-400">Add Money to Wallet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Amount (₹)
              </label>
              <Input
                type="number"
                placeholder="Enter amount (min: ₹100)"
                className="bg-black border-gray-700 text-white text-lg text-center"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="100"
                step="100"
              />
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setShowAddMoney(false)}>
                Cancel
              </Button>
              <Button
                onClick={initiateAddMoney}
                disabled={!amount || parseFloat(amount) < 100 || paymentLoading}
                className="bg-green-500 hover:bg-green-600 text-black"
              >
                {paymentLoading ? 'Processing...' : 'Add Money'}
              </Button>
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
              className={`flex flex-col items-center space-y-1 h-auto py-2 px-3 transition-all duration-200 ${item.screen === "wallet"
                  ? "text-green-400 bg-green-500/10 shadow-lg shadow-green-500/20"
                  : "text-gray-400 hover:text-green-400"
                }`}
              onClick={() => {
                if (item.screen !== "wallet") {
                  if (onNavigate) {
                    onNavigate(item.screen as "home" | "squad" | "wallet" | "matches" | "leaderboard" | "live" | "settings");
                  } else {
                    console.log('Navigation function not provided, cannot navigate to:', item.screen);
                    showToast(`Navigation to ${item.screen} not available`, "error");
                  }
                }
              }}
            >
              <item.icon className={`w-5 h-5 ${item.screen === "wallet" ? "animate-pulse" : ""}`} />
              <span className="text-xs font-medium">{item.label}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}