"use client";

import React, { useState, useEffect } from 'react';
import { notificationService } from '../services/notificationService';
import { Bell, Info, AlertTriangle, XCircle, Mail, DollarSign, Gamepad2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function NotificationCenter() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    // Toast state
    const [toast, setToast] = useState<{ title: string; message: string; visible: boolean } | null>(null);

    // Ref to track last seen ID to avoid stale closure issues in setInterval
    const lastSeenIdRef = React.useRef<string | null>(null);

    const pollNotifications = async () => {
        const response = await notificationService.getNotifications();
        if (response.success && response.data.length > 0) {
            const latest = response.data[0];

            // If we have a last seen ID, and the new latest is different, it's a new notification
            if (lastSeenIdRef.current && latest._id !== lastSeenIdRef.current) {
                setToast({
                    title: latest.title,
                    message: latest.message,
                    visible: true
                });
                setTimeout(() => setToast(null), 5000);
            }

            // Update ref
            lastSeenIdRef.current = latest._id;

            setNotifications(response.data);
            setUnreadCount(response.unreadCount);
        }
    };

    useEffect(() => {
        // Initial load
        const init = async () => {
            setLoading(true);
            const response = await notificationService.getNotifications();
            if (response.success) {
                setNotifications(response.data);
                setUnreadCount(response.unreadCount);
                if (response.data.length > 0) {
                    lastSeenIdRef.current = response.data[0]._id;
                }
            }
            setLoading(false);
        };
        init();

        const interval = setInterval(pollNotifications, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleMarkAsRead = async (id: string) => {
        // Optimistic update
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));

        await notificationService.markAsRead(id);
    };

    const handleMarkAllAsRead = async () => {
        // Optimistic update
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);

        await notificationService.markAllAsRead();
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'invite': return <Mail className="w-4 h-4 text-blue-400" />;
            case 'match_start': return <Gamepad2 className="w-4 h-4 text-green-400" />;
            case 'payment': return <DollarSign className="w-4 h-4 text-yellow-400" />;
            case 'warning': return <AlertTriangle className="w-4 h-4 text-orange-400" />;
            case 'error': return <XCircle className="w-4 h-4 text-red-400" />;
            default: return <Info className="w-4 h-4 text-gray-400" />;
        }
    };

    return (
        <>
            {/* Custom Toast Notification */}
            {toast && (
                <div className="fixed top-24 right-4 z-[100] animate-in slide-in-from-right-full fade-in duration-300">
                    <div className="bg-gray-900 border border-green-500/30 text-white p-4 rounded-lg shadow-2xl flex items-start gap-3 max-w-sm">
                        <div className="bg-green-500/20 p-2 rounded-full">
                            <Bell className="w-5 h-5 text-green-400" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-semibold text-sm text-green-400">{toast.title}</h4>
                            <p className="text-xs text-gray-300 mt-1">{toast.message}</p>
                        </div>
                        <button onClick={() => setToast(null)} className="text-gray-500 hover:text-white">
                            <XCircle className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            <Popover open={open} onOpenChange={(isOpen) => {
                setOpen(isOpen);
                if (isOpen) pollNotifications(); // Refresh on open
            }}>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative text-gray-400 hover:text-white hover:bg-gray-800">
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && (
                            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs rounded-full">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </Badge>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0 bg-gray-900 border-gray-800 text-white" align="end">
                    <div className="flex items-center justify-between p-4 border-b border-gray-800">
                        <h4 className="font-semibold">Notifications</h4>
                        {unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs text-blue-400 hover:text-blue-300 h-auto p-0"
                                onClick={handleMarkAllAsRead}
                            >
                                Mark all read
                            </Button>
                        )}
                    </div>
                    <ScrollArea className="h-[300px]">
                        {loading && notifications.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 text-sm">Loading...</div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 text-sm">
                                <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                No notifications yet
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-800">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification._id}
                                        className={cn(
                                            "p-4 hover:bg-gray-800/50 transition-colors cursor-pointer relative group",
                                            !notification.isRead && "bg-gray-800/30"
                                        )}
                                        onClick={() => !notification.isRead && handleMarkAsRead(notification._id)}
                                    >
                                        <div className="flex gap-3">
                                            <div className="mt-1 flex-shrink-0">
                                                {getIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <p className={cn("text-sm font-medium leading-none", !notification.isRead ? "text-white" : "text-gray-400")}>
                                                    {notification.title}
                                                </p>
                                                <p className="text-xs text-gray-500 line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                <p className="text-[10px] text-gray-600">
                                                    {new Date(notification.createdAt).toLocaleDateString()} • {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                            {!notification.isRead && (
                                                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </PopoverContent>
            </Popover>
        </>
    );
}
