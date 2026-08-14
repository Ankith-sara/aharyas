import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { backendUrl } from '../config';

const useAdminAnalytics = () => {
    const socketRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    const [counters, setCounters] = useState({
        onlineUsers: 0,
        todayProductViews: 0,
        todayCartAdds: 0,
        todayCheckouts: 0,
        todayOrders: 0,
        todaySearches: 0,
    });

    const addToFeed = useCallback(() => {}, []);

    useEffect(() => {
        const socket = io(`${backendUrl}/admin-analytics`, {
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 10,
            reconnectionDelay: 2000,
        });

        socketRef.current = socket;

        socket.on('connect', () => setIsConnected(true));
        socket.on('disconnect', () => setIsConnected(false));

        // Initial state
        socket.on('dashboard:counters', (data) => setCounters(data));

        // Real-time events
        socket.on('user:connected', (data) => {
            setCounters((prev) => ({ ...prev, onlineUsers: data.onlineUsers }));
        });

        socket.on('user:disconnected', (data) => {
            setCounters((prev) => ({ ...prev, onlineUsers: data.onlineUsers }));
        });

        socket.on('product:viewed', (data) => {
            setCounters((prev) => ({ ...prev, todayProductViews: data.todayProductViews }));
        });

        socket.on('cart:added', (data) => {
            setCounters((prev) => ({ ...prev, todayCartAdds: data.todayCartAdds }));
        });

        socket.on('checkout:started', (data) => {
            setCounters((prev) => ({ ...prev, todayCheckouts: data.todayCheckouts }));
        });

        socket.on('order:placed', (data) => {
            setCounters((prev) => ({ ...prev, todayOrders: data.todayOrders }));
        });

        socket.on('search:performed', (data) => {
            setCounters((prev) => ({ ...prev, todaySearches: data.todaySearches }));
        });

        return () => {
            socket.disconnect();
        };
    }, [addToFeed]);

    return { isConnected, counters };
};

export default useAdminAnalytics;