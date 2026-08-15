'use client';

import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Line, Doughnut, Bar } from "react-chartjs-2";
import { 
    Chart as ChartJS, CategoryScale, LinearScale, PointElement,
    LineElement, Title, Tooltip, Legend, BarElement, ArcElement
} from "chart.js";
import { useRouter, usePathname } from "next/navigation";
import {
    ShoppingBag, TrendingUp, Package, IndianRupee, CheckCircle, Download, 
    Search, RefreshCw, AlertCircle, User, Eye, Shield, X, Camera, Mail, Phone, 
    MapPin, Save, Edit3, Lock, Activity, ShoppingCart, Truck, Banknote
} from "lucide-react";
import { jwtDecode } from "jwt-decode";
import { backendUrl, currency } from "@/config";
import OrderDetailModal from "@/components/OrderDetailModal";
import useAdminAnalytics from "@/hooks/useAdminAnalytics";
import { useAuth } from "@/context/AuthContext";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement, ArcElement);

const isTokenValid = (token: string | null): boolean => {
    if (!token) return false;
    try {
        const { exp } = jwtDecode<{ exp?: number }>(token);
        return exp ? exp * 1000 > Date.now() + 30_000 : false;
    } catch { return false; }
};

const STALE_MS = 2 * 60 * 1000;
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const AnalyticsTab = ({ adminData }: { adminData: any }) => {
    const { token, logout } = useAuth();
    const { isConnected, counters } = useAdminAnalytics();
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastFetched, setLastFetched] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [userAnalytics, setUserAnalytics] = useState<any>(null);
    const [mostClickedProducts, setMostClickedProducts] = useState<any[]>([]);
    const [userAnalyticsLoading, setUserAnalyticsLoading] = useState(true);
    const [mostClickedLoading, setMostClickedLoading] = useState(true);
    const [vercelAnalytics, setVercelAnalytics] = useState<any>(null);
    const [vercelLoading, setVercelLoading] = useState(true);
    const [dashboardTab, setDashboardTab] = useState("sales");
    const router = useRouter();

    const fetchVercelAnalyticsData = async () => {
        if (!token || !isTokenValid(token)) {
            setVercelLoading(false);
            return;
        }
        try {
            setVercelLoading(true);
            const res = await axios.get(`${backendUrl}/api/v1/user/vercel-analytics`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.data?.success && res.data?.data && res.data?.data?.byPath && res.data.data.byPath.length > 0) {
                setVercelAnalytics(res.data.data);
            } else {
                setVercelAnalytics(null);
            }
        } catch (error) {
            console.error("Failed to load Vercel analytics:", error);
            setVercelAnalytics(null);
        } finally {
            setVercelLoading(false);
        }
    };

    useEffect(() => {
        if (token) { 
            fetchAnalytics(); 
            fetchRecentOrders(); 
            fetchUserAnalytics();
            fetchMostClickedProducts();
            fetchVercelAnalyticsData();
        }
    }, [token]);

    const fetchAnalytics = async (force = false) => {
        if (!token || !isTokenValid(token)) {
            toast.error("Session expired. Please login again.");
            logout();
            return;
        }
        if (!force && lastFetched && Date.now() - lastFetched < STALE_MS) return;
        try {
            if (force) setRefreshing(true); else setLoading(true);
            const res = await axios.get(`${backendUrl}/api/v1/product/analytics`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.data.success) {
                setAnalytics(res.data.analytics);
                setLastFetched(Date.now());
            }
        } catch (error: any) {
            if (error.response?.status === 401) {
                toast.error("Session expired.");
                logout();
                router.push("/");
            } else toast.error("Failed to load analytics.");
        } finally { setLoading(false); setRefreshing(false); }
    };

    const fetchRecentOrders = async () => {
        if (!token || !isTokenValid(token)) { logout(); return; }
        try {
            setOrdersLoading(true);
            const res = await axios.get(`${backendUrl}/api/v1/order/list`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.data.success) {
                const orders = Array.isArray(res.data.orders) ? res.data.orders : [];
                setRecentOrders([...orders].sort((a, b) => Number(b.date) - Number(a.date)));
            }
        } catch { /* silent */ } finally { setOrdersLoading(false); }
    };

    const fetchUserAnalytics = async () => {
        if (!token || !isTokenValid(token)) return;
        try {
            setUserAnalyticsLoading(true);
            const res = await axios.get(`${backendUrl}/api/v1/user/analytics`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.data.success) {
                setUserAnalytics(res.data.analytics);
            }
        } catch (error) {
            console.error("Failed to load user analytics:", error);
        } finally {
            setUserAnalyticsLoading(false);
        }
    };

    const fetchMostClickedProducts = async () => {
        if (!token || !isTokenValid(token)) return;
        try {
            setMostClickedLoading(true);
            const res = await axios.get(`${backendUrl}/api/v1/product/most-clicked`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.data.success) {
                setMostClickedProducts(res.data.products || []);
            }
        } catch (error) {
            console.error("Failed to load most clicked products:", error);
        } finally {
            setMostClickedLoading(false);
        }
    };

    const handleRefresh = () => {
        fetchAnalytics(true);
        fetchRecentOrders();
        fetchUserAnalytics();
        fetchMostClickedProducts();
        fetchVercelAnalyticsData();
        toast.success("Dashboard refreshed");
    };

    const totalRevenue = analytics?.totalRevenue ?? 0;
    const todayRevenue = analytics?.todayRevenue ?? 0;
    const totalOrders = analytics?.totalOrders ?? 0;
    const avgOrder = analytics?.avgOrderValue ?? 0;

    const paidCount = recentOrders.filter(o => o.payment).length;
    const unpaidCount = recentOrders.filter(o => !o.payment).length;

    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayOrders = recentOrders.filter(o => new Date(o.date) >= todayStart);

    const chartOptions = {
        responsive: true, maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: "#000", titleColor: "#fff", bodyColor: "#fff",
                borderColor: "#333", borderWidth: 1,
                callbacks: { label: (ctx: any) => ` ${currency} ${ctx.parsed.y.toLocaleString("en-IN")}` },
            },
        },
        scales: {
            x: { grid: { color: "rgba(0,0,0,0.05)" }, ticks: { color: "#666", font: { size: 10 }, maxTicksLimit: 7 } },
            y: { grid: { color: "rgba(0,0,0,0.05)" }, ticks: { color: "#666", font: { size: 10 }, callback: (v: any) => `₹${v.toLocaleString("en-IN")}` } },
        },
    };

    const vercelChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: true, position: 'top' as const, labels: { boxWidth: 12, font: { size: 10 } } },
            tooltip: {
                backgroundColor: "#000", titleColor: "#fff", bodyColor: "#fff",
                borderColor: "#333", borderWidth: 1,
            },
        },
        scales: {
            x: {
                grid: { color: "rgba(0,0,0,0.05)" },
                ticks: {
                    display: true,
                    color: "#333333",
                    font: { size: 10, weight: "bold" as const },
                    maxRotation: 0,
                    autoSkip: true,
                }
            },
            y: { grid: { color: "rgba(0,0,0,0.05)" }, ticks: { color: "#666", font: { size: 10 } } },
        },
    };

    const monthlySales = analytics?.monthlySales || [];
    const categoryBreakdown = analytics?.categoryBreakdown || [];

    const salesChart = {
        labels: monthlySales.map((m: any) => `${MONTH_NAMES[m._id.month - 1]} ${m._id.year}`),
        datasets: [{
            label: "Revenue", data: monthlySales.map((m: any) => m.revenue),
            borderColor: "#000", backgroundColor: "rgba(0,0,0,0.05)", fill: true, tension: 0.4,
            pointBackgroundColor: "#000", pointBorderColor: "#fff", pointBorderWidth: 2, pointRadius: 3,
        }],
    };

    const doughnutChart = {
        labels: categoryBreakdown.map((c: any) => c._id || "Other"),
        datasets: [{
            data: categoryBreakdown.map((c: any) => c.count),
            backgroundColor: ["#e100ff", "#4841a4", "#5dc4c6", "#75b771", "#eeff00", "#ff6b6b", "#ffa500"],
            borderWidth: 2, borderColor: "#fff",
        }],
    };

    // Real Data for Daily User Logins from Backend API
    const dailyLoginsData = userAnalytics?.dailyLogins || [];
    const loginsChart = {
        labels: dailyLoginsData.map((d: any) => `${d._id?.day || ''} ${MONTH_NAMES[(d._id?.month || 1) - 1]}`),
        datasets: [{
            label: "Active Logins", data: dailyLoginsData.map((d: any) => d.count),
            borderColor: "#000", backgroundColor: "rgba(0,0,0,0.05)", fill: true, tension: 0.4,
            pointBackgroundColor: "#000", pointBorderColor: "#fff", pointBorderWidth: 2, pointRadius: 3,
        }],
    };

    const loginsChartOptions = {
        responsive: true, maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: "#000", titleColor: "#fff", bodyColor: "#fff",
                borderColor: "#333", borderWidth: 1,
                callbacks: { label: (ctx: any) => ` Logins: ${ctx.parsed.y}` },
            },
        },
        scales: {
            x: { grid: { color: "rgba(0,0,0,0.05)" }, ticks: { color: "#666", font: { size: 10 }, maxTicksLimit: 10 } },
            y: { grid: { color: "rgba(0,0,0,0.05)" }, ticks: { color: "#666", font: { size: 10 }, stepSize: 1, precision: 0 } },
        },
    };

    const mostClickedChart = {
        labels: mostClickedProducts.map((p: any) => p.name?.length > 20 ? p.name.substring(0, 20) + "..." : (p.name || 'Product')),
        datasets: [{
            label: "Views",
            data: mostClickedProducts.map((p: any) => p.viewCount || 0),
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            hoverBackgroundColor: "#000",
            borderRadius: 4,
            barThickness: 16,
        }],
    };

    const mostClickedChartOptions = {
        responsive: true,
        indexAxis: 'y' as const,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: "#000", titleColor: "#fff", bodyColor: "#fff",
                borderColor: "#333", borderWidth: 1,
                callbacks: { label: (ctx: any) => ` Views: ${ctx.parsed.x}` },
            },
        },
        scales: {
            x: { grid: { color: "rgba(0,0,0,0.05)" }, ticks: { color: "#666", font: { size: 10 }, stepSize: 1, precision: 0 } },
            y: { grid: { display: false }, ticks: { color: "#333", font: { size: 10 } } },
        },
    };

    const filteredOrders = recentOrders.filter(o =>
        o.address?.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o._id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Advanced Business Intelligence Analysis (Real Data)
    const detailedReport = (() => {
        if (!analytics || recentOrders.length === 0) return null;
        
        // 1. COD vs Prepaid Split
        const codOrders = recentOrders.filter(o => o.paymentMethod === "COD").length;
        const onlineOrders = recentOrders.length - codOrders;
        const prepaidPct = recentOrders.length > 0 ? Math.round((onlineOrders / recentOrders.length) * 100) : 0;
        const codPct = 100 - prepaidPct;

        // 2. Today's Checkout Conversion Rate (Real live counters)
        const cartAdds = counters.todayCartAdds || 0;
        const checkouts = counters.todayCheckouts || 0;
        const conversionRate = cartAdds > 0 ? ((checkouts / cartAdds) * 100).toFixed(1) : null;

        // 3. Month over Month Growth
        let momGrowth: number | null = null;
        let momRevenueDiff = 0;
        if (monthlySales.length >= 2) {
            const latest = monthlySales[monthlySales.length - 1];
            const prev = monthlySales[monthlySales.length - 2];
            momRevenueDiff = latest.revenue - prev.revenue;
            momGrowth = prev.revenue > 0 ? ((latest.revenue - prev.revenue) / prev.revenue) * 100 : 0;
        }

        // 4. Category Dominance
        let topCategory: any = null;
        let topCategoryPct = 0;
        const totalCatCount = categoryBreakdown.reduce((sum: number, c: any) => sum + c.count, 0);
        if (categoryBreakdown.length > 0 && totalCatCount > 0) {
            topCategory = categoryBreakdown[0];
            topCategoryPct = Math.round((topCategory.count / totalCatCount) * 100);
        }

        // 5. High Click, Low Conversion (Real Data calculated from products and sales)
        const highClickLowSales = (mostClickedProducts || [])
            .filter((p: any) => (p.viewCount || 0) > 0)
            .map((p: any) => ({
                name: p.name || 'Unnamed Product',
                views: p.viewCount || 0,
                sold: p.sold || 0
            }))
            .sort((a: any, b: any) => (a.sold / (a.views || 1)) - (b.sold / (b.views || 1)))
            .slice(0, 10);

        // 6. Actionable recommendations
        const recommendations: any[] = [];
        if (codPct > 60) {
            recommendations.push({
                type: "warning",
                title: "COD Optimization Strategy",
                desc: `${codPct}% of orders are COD. Run a 5% discount on prepaid payments to increase prepaid conversion, reduce shipping return risk (RTO), and secure cash flow.`
            });
        } else {
            recommendations.push({
                type: "success",
                title: "Prepaid Trust is Strong",
                desc: `${prepaidPct}% of orders are prepaid, showing high customer brand trust. Keep transaction channels optimized.`
            });
        }

        if (highClickLowSales.length > 0) {
            const worst = highClickLowSales[0];
            recommendations.push({
                type: "action",
                title: "Conversion Opportunity",
                desc: `"${worst.name}" has high view counts (${worst.views} views) but low conversions (${worst.sold} sales). Consider offering a limited-time coupon or adding customer review testimonials on this page.`
            });
        }

        if (topCategoryPct > 40 && topCategory) {
            recommendations.push({
                type: "info",
                title: "Diversify Catalog Balance",
                desc: `"${topCategory._id}" represents ${topCategoryPct}% of total products. Consider diversifying design releases into other categories to balance inventory risk.`
            });
        }

        if (conversionRate && parseFloat(conversionRate) < 15) {
            recommendations.push({
                type: "warning",
                title: "High Cart Abandonment Rate",
                desc: `Today's cart addition-to-checkout rate is low (${conversionRate}%). Optimize checkout fields or implement automated abandoned cart emails to recover sales.`
            });
        }

        return {
            prepaidPct,
            codPct,
            conversionRate,
            momGrowth,
            momRevenueDiff,
            topCategory,
            topCategoryPct,
            highClickLowSales,
            recommendations
        };
    })();

    if (loading) return (
        <div className="flex items-center justify-center min-h-64">
            <div className="text-center">
                <div className="w-10 h-10 border-4 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-gray-500 font-light uppercase tracking-wider">Loading analytics…</p>
            </div>
        </div>
    );

    if (!analytics) return (
        <div className="flex items-center justify-center min-h-64">
            <div className="text-center">
                <AlertCircle className="mx-auto text-gray-400 mb-3" size={40} />
                <p className="text-sm text-gray-500 font-light mb-3">Failed to load analytics.</p>
                <button onClick={() => fetchAnalytics(true)}
                    className="px-4 py-2 bg-black text-white text-xs uppercase tracking-wide hover:bg-gray-800">
                    Retry
                </button>
            </div>
        </div>
    );

    // Quick-action order handlers
    const handleQuickStatus = async (orderId: string, newStatus: string) => {
        setRecentOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
        try {
            await axios.post(`${backendUrl}/api/v1/order/status`, { orderId, status: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
            toast.success(`Order → ${newStatus}`);
        } catch { toast.error("Failed to update status"); fetchRecentOrders(); }
    };
    const handleQuickPay = async (orderId: string) => {
        setRecentOrders(prev => prev.map(o => o._id === orderId ? { ...o, payment: true } : o));
        try {
            await axios.post(`${backendUrl}/api/v1/order/updatePayment`, { orderId, payment: true }, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("Payment marked as paid");
        } catch { toast.error("Failed to update payment"); fetchRecentOrders(); }
    };
    const handleQuickDeliver = async (order: any) => {
        if (order.paymentMethod === "COD" && !order.payment) {
            setRecentOrders(prev => prev.map(o => o._id === order._id ? { ...o, status: "Delivered", payment: true } : o));
            try {
                await Promise.all([
                    axios.post(`${backendUrl}/api/v1/order/status`, { orderId: order._id, status: "Delivered" }, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.post(`${backendUrl}/api/v1/order/updatePayment`, { orderId: order._id, payment: true }, { headers: { Authorization: `Bearer ${token}` } }),
                ]);
                toast.success("Delivered & payment confirmed");
            } catch { toast.error("Failed"); fetchRecentOrders(); }
        } else {
            handleQuickStatus(order._id, "Delivered");
        }
    };

    // COD vs Prepaid RTO Risk data
    const codRiskData = (() => {
        const codOrders = recentOrders.filter(o => o.paymentMethod === "COD");
        const prepaidOrders = recentOrders.filter(o => o.paymentMethod !== "COD");
        const classify = (orders: any[]) => ({
            delivered: orders.filter(o => o.status === "Delivered").length,
            paid: orders.filter(o => o.payment && o.status !== "Delivered").length,
            pending: orders.filter(o => !o.payment && o.status !== "Delivered").length,
        });
        return { cod: classify(codOrders), prepaid: classify(prepaidOrders), codTotal: codOrders.length, prepaidTotal: prepaidOrders.length };
    })();

    // Funnel data from live WebSocket counters
    const funnelStages = [
        { label: "Product Views", value: counters.todayProductViews || 0, color: "#000" },
        { label: "Added to Cart", value: counters.todayCartAdds || 0, color: "#333" },
        { label: "Reached Checkout", value: counters.todayCheckouts || 0, color: "#555" },
        { label: "Completed Purchase", value: counters.todayOrders || 0, color: "#777" },
    ];
    const funnelMax = Math.max(1, funnelStages[0].value);

    // Stacked bar chart data for COD vs Prepaid status breakdown
    const rtoChartData = {
        labels: ['COD', 'Prepaid'],
        datasets: [
            {
                label: 'Delivered',
                data: [codRiskData.cod.delivered, codRiskData.prepaid.delivered],
                backgroundColor: '#10B981',
                borderRadius: 4,
            },
            {
                label: 'Paid (Active)',
                data: [codRiskData.cod.paid, codRiskData.prepaid.paid],
                backgroundColor: '#3B82F6',
                borderRadius: 4,
            },
            {
                label: 'Pending Payment',
                data: [codRiskData.cod.pending, codRiskData.prepaid.pending],
                backgroundColor: '#F59E0B',
                borderRadius: 4,
            }
        ]
    };

    const rtoChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: { boxWidth: 12, font: { size: 10, family: 'Inter' }, color: '#374151' }
            },
            tooltip: {
                backgroundColor: '#1F2937',
                titleColor: '#FFF',
                bodyColor: '#FFF',
                padding: 10,
                cornerRadius: 4
            }
        },
        scales: {
            x: {
                stacked: true,
                grid: { display: false },
                ticks: { color: '#4B5563', font: { size: 11, weight: 'bold' as const } }
            },
            y: {
                stacked: true,
                grid: { color: '#F3F4F6' },
                ticks: { color: '#4B5563', font: { size: 10 } }
            }
        }
    };

    return (
        <div className="max-w-8xl mx-auto space-y-4 sm:space-y-6 px-4 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                        <h2 className="text-xl sm:text-2xl font-semibold text-black uppercase tracking-wide truncate m-0">
                            {adminData ? `Welcome, ${adminData.name.split(" ")[0]}` : "Dashboard"}
                        </h2>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${
                            isConnected 
                                ? 'bg-green-50 text-green-700 border-green-200' 
                                : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                            {isConnected ? `${counters.onlineUsers} Online Now` : 'Offline'}
                        </span>
                    </div>
                    <p className="text-[10px] sm:text-xs text-gray-500 font-light mt-1 uppercase tracking-wider">
                        {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="flex items-center gap-1.5 px-3 sm:px-4 py-2 border border-gray-300 hover:border-black text-xs uppercase tracking-wide font-light transition-all disabled:opacity-50 flex-shrink-0"
                    >
                        <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                </div>
            </div>

            {/* Sub-tab Switcher */}
            <div className="flex border-b border-gray-200 overflow-x-auto flex-nowrap">
                <button
                    onClick={() => setDashboardTab("sales")}
                    className={`px-6 py-3 text-xs uppercase tracking-wider font-medium border-b-2 transition-all ${
                        dashboardTab === "sales"
                            ? "border-black text-black"
                            : "border-transparent text-gray-500 hover:text-black"
                    }`}
                >
                    Sales Pulse
                </button>
                <button
                    onClick={() => setDashboardTab("behavior")}
                    className={`px-6 py-3 text-xs uppercase tracking-wider font-medium border-b-2 transition-all ${
                        dashboardTab === "behavior"
                            ? "border-black text-black"
                            : "border-transparent text-gray-500 hover:text-black"
                    }`}
                >
                    User Analytics
                </button>
                <button
                    onClick={() => setDashboardTab("traffic")}
                    className={`px-6 py-3 text-xs uppercase tracking-wider font-medium border-b-2 transition-all ${
                        dashboardTab === "traffic"
                            ? "border-black text-black"
                            : "border-transparent text-gray-500 hover:text-black"
                    }`}
                >
                    Web Traffic
                </button>
            </div>

            {dashboardTab === "sales" && (
                <div className="space-y-6">
                    {/* Top Row: The Pulse (3 Cards) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Revenue Card */}
                        <div className="bg-black text-white p-6 shadow-sm flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <IndianRupee size={16} className="text-gray-400" />
                                    <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Revenue</h3>
                                </div>
                                <p className="text-3xl font-light tracking-tight">{currency} {totalRevenue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-800 text-xs text-gray-400 space-y-1">
                                <div className="flex justify-between">
                                    <span>Today's Sales:</span>
                                    <span className="font-medium text-white">{currency} {todayRevenue.toLocaleString("en-IN")}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Today's Orders:</span>
                                    <span className="font-medium text-white">{counters.todayOrders}</span>
                                </div>
                            </div>
                        </div>

                        {/* Paid vs Unpaid Card */}
                        <div className="bg-white border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <Banknote size={16} className="text-gray-500" />
                                    <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Paid vs. Unpaid Orders</h3>
                                </div>
                                <div className="flex items-baseline gap-4 mb-2">
                                    <div>
                                        <p className="text-3xl font-light text-black">{paidCount}</p>
                                        <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider">Paid</p>
                                    </div>
                                    <div className="h-8 w-px bg-gray-200" />
                                    <div>
                                        <p className="text-3xl font-light text-black">{unpaidCount}</p>
                                        <p className="text-[10px] text-yellow-600 font-bold uppercase tracking-wider">Unpaid</p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4">
                                <div className="w-full bg-gray-100 h-2 flex overflow-hidden rounded-full">
                                    <div className="bg-green-500 h-full transition-all duration-500" style={{ width: recentOrders.length > 0 ? `${((paidCount / recentOrders.length) * 100)}%` : "0%" }} />
                                    <div className="bg-yellow-500 h-full transition-all duration-500" style={{ width: recentOrders.length > 0 ? `${((unpaidCount / recentOrders.length) * 100)}%` : "0%" }} />
                                </div>
                                <p className="text-[10px] text-gray-400 mt-2 flex justify-between">
                                    <span>Success Rate</span>
                                    <span className="font-semibold text-gray-700">{recentOrders.length > 0 ? ((paidCount / recentOrders.length) * 100).toFixed(1) : 0}%</span>
                                </p>
                            </div>
                        </div>

                        {/* AOV Card */}
                        <div className="bg-white border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <TrendingUp size={16} className="text-gray-500" />
                                    <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Average Order Value</h3>
                                </div>
                                <p className="text-3xl font-light text-black tracking-tight">{currency} {avgOrder.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
                                <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">per paid order</p>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                                <span className="text-[10px] text-gray-400 uppercase tracking-wider">MoM Growth:</span>
                                {detailedReport?.momGrowth !== null && detailedReport?.momGrowth !== undefined ? (
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase border ${
                                        detailedReport.momGrowth >= 0 
                                            ? "bg-green-50 text-green-700 border-green-200" 
                                            : "bg-red-50 text-red-700 border-red-200"
                                    }`}>
                                        {detailedReport.momGrowth >= 0 ? "+" : ""}{detailedReport.momGrowth.toFixed(1)}%
                                    </span>
                                ) : (
                                    <span className="text-xs text-gray-400 font-light">N/A</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Middle Section: The Money & The Leaks */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Middle Left: The Money (COD vs Prepaid RTO Risk chart) */}
                        <div className="bg-white border border-gray-200 p-6 shadow-sm lg:col-span-6 flex flex-col">
                            <div className="mb-4">
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-black">COD vs Prepaid RTO Tracker</h3>
                                <p className="text-xs text-gray-500 font-light mt-0.5">RTO Risk Breakdown (COD: {codRiskData.codTotal} orders, Prepaid: {codRiskData.prepaidTotal} orders)</p>
                            </div>
                            <div className="h-64 relative flex-1">
                                <Bar data={rtoChartData} options={rtoChartOptions} />
                            </div>
                        </div>

                        {/* Middle Right: The Leaks (Funnel & Click/Sale Gap) */}
                        <div className="bg-white border border-gray-200 p-6 shadow-sm lg:col-span-6 space-y-6">
                            <div>
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-black mb-4">Conversions Funnel (Drop-off)</h3>
                                <div className="space-y-3">
                                    {funnelStages.map((stage, idx) => {
                                        const percentage = funnelMax > 0 ? Math.round((stage.value / funnelMax) * 100) : 0;
                                        return (
                                            <div key={idx} className="space-y-1">
                                                <div className="flex justify-between text-xs">
                                                    <span className="font-medium text-gray-700">{stage.label}</span>
                                                    <span className="text-gray-500 font-semibold">{stage.value} ({percentage}%)</span>
                                                </div>
                                                <div className="w-full bg-gray-100 h-4 overflow-hidden rounded">
                                                    <div 
                                                        className="h-full transition-all duration-500 flex items-center justify-end pr-2 text-[9px] text-white font-bold"
                                                        style={{ 
                                                            width: `${percentage}%`, 
                                                            backgroundColor: stage.color 
                                                        }}
                                                    >
                                                        {percentage > 10 && `${percentage}%`}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <hr className="border-gray-100" />

                            <div>
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-black mb-3">High Click / Low Sale Gap</h3>
                                {detailedReport?.highClickLowSales && detailedReport.highClickLowSales.length > 0 ? (
                                    <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                                        {detailedReport.highClickLowSales.map((item: any, idx: number) => {
                                            const rate = item.views > 0 ? ((item.sold / item.views) * 100).toFixed(1) : "0";
                                            return (
                                                <div key={idx} className="space-y-1.5">
                                                    <div className="flex justify-between text-xs">
                                                        <span className="font-medium text-gray-800 truncate max-w-[70%]">{item.name}</span>
                                                        <span className="bg-red-50 text-red-700 text-[10px] px-1.5 py-0.5 font-bold uppercase tracking-wider border border-red-100">{rate}% CR</span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-500">
                                                        <div className="space-y-0.5">
                                                            <div className="flex justify-between">
                                                                <span>Views:</span>
                                                                <span className="font-semibold text-gray-700">{item.views}</span>
                                                            </div>
                                                            <div className="w-full bg-gray-100 h-1.5 rounded overflow-hidden">
                                                                <div className="bg-black h-full" style={{ width: `${Math.min(100, (item.views / 20) * 100)}%` }} />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            <div className="flex justify-between">
                                                                <span>Sales:</span>
                                                                <span className="font-semibold text-gray-700">{item.sold}</span>
                                                            </div>
                                                            <div className="w-full bg-gray-100 h-1.5 rounded overflow-hidden">
                                                                <div className="bg-green-500 h-full" style={{ width: `${Math.min(100, (item.sold / 5) * 100)}%` }} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-400 font-light italic">No critical conversion gaps identified today.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Recommendations / Insights Panel */}
                    {detailedReport?.recommendations && detailedReport.recommendations.length > 0 && (
                        <div className="bg-gray-50 border border-gray-200 p-6 shadow-sm">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">Actionable AI Insights</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {detailedReport.recommendations.map((rec: any, i: number) => (
                                    <div key={i} className="bg-white p-4 border border-gray-200 rounded flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`w-2 h-2 rounded-full ${
                                                    rec.type === "warning" ? "bg-amber-500" :
                                                    rec.type === "success" ? "bg-green-500" : "bg-blue-500"
                                                }`} />
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-black">{rec.title}</h4>
                                            </div>
                                            <p className="text-xs text-gray-600 font-light leading-relaxed">{rec.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Bottom half: Recent Orders table */}
                    <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-black">Recent Orders & Action Board</h3>
                                <p className="text-xs text-gray-500 font-light mt-0.5">Quickly fulfill, ship, and record payments inline</p>
                            </div>
                            <div className="relative max-w-md w-full sm:w-72">
                                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search order ID or client name..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-gray-50 pl-10 pr-4 py-2 border border-gray-200 text-xs focus:bg-white focus:border-black outline-none transition-all"
                                />
                            </div>
                        </div>

                        {ordersLoading ? (
                            <div className="p-12 text-center text-xs text-gray-400 font-light uppercase tracking-wider">Loading orders...</div>
                        ) : filteredOrders.length === 0 ? (
                            <div className="p-12 text-center text-xs text-gray-400 font-light italic">No matching orders found.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px] font-bold border-b border-gray-100">
                                            <th className="p-4 font-semibold">Order ID</th>
                                            <th className="p-4 font-semibold">Customer</th>
                                            <th className="p-4 font-semibold">Date</th>
                                            <th className="p-4 font-semibold">Total</th>
                                            <th className="p-4 font-semibold">Payment</th>
                                            <th className="p-4 font-semibold">Status</th>
                                            <th className="p-4 font-semibold text-right">Quick Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredOrders.slice(0, 10).map((order: any) => {
                                            const name = order.address?.Name || "Anonymous";
                                            const total = order.amount || 0;
                                            const orderDate = new Date(order.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
                                            const orderNo = order._id ? order._id.substring(order._id.length - 8).toUpperCase() : "";
                                            
                                            // Determine action states
                                            const canShip = order.status === "Order Placed" || order.status === "Processing";
                                            const canDeliver = order.status === "Shipping" || order.status === "Out of delivery";
                                            const canMarkPaid = !order.payment;

                                            return (
                                                <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="p-4 font-mono font-bold text-gray-900">#{orderNo}</td>
                                                    <td className="p-4 text-gray-700 font-medium">{name}</td>
                                                    <td className="p-4 text-gray-500">{orderDate}</td>
                                                    <td className="p-4 font-medium text-black">{currency} {total.toLocaleString("en-IN")}</td>
                                                    <td className="p-4">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                                                            order.payment 
                                                                ? "bg-green-50 text-green-700 border-green-200" 
                                                                : "bg-red-50 text-red-700 border-red-200 animate-pulse"
                                                        }`}>
                                                            {order.paymentMethod} · {order.payment ? "PAID" : "UNPAID"}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase border ${
                                                            order.status === "Delivered" ? "bg-green-50 text-green-700 border-green-200" :
                                                            order.status === "Shipping" ? "bg-blue-50 text-blue-700 border-blue-200" :
                                                            order.status === "Returned" || order.status === "RTO" ? "bg-red-50 text-red-700 border-red-200" :
                                                            "bg-amber-50 text-amber-700 border-amber-200"
                                                        }`}>
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <div className="inline-flex items-center gap-1.5">
                                                            {canShip && (
                                                                <button
                                                                    onClick={() => handleQuickStatus(order._id, "Shipping")}
                                                                    className="px-2 py-1 bg-black text-white hover:bg-gray-800 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
                                                                    title="Mark as Shipped"
                                                                >
                                                                    <Truck size={10} /> Ship
                                                                </button>
                                                            )}
                                                            {canDeliver && (
                                                                <button
                                                                    onClick={() => handleQuickDeliver(order)}
                                                                    className="px-2 py-1 bg-green-600 text-white hover:bg-green-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
                                                                    title="Mark as Delivered"
                                                                >
                                                                    <CheckCircle size={10} /> Deliver
                                                                </button>
                                                            )}
                                                            {canMarkPaid && (
                                                                <button
                                                                    onClick={() => handleQuickPay(order._id)}
                                                                    className="px-2 py-1 bg-yellow-500 text-black hover:bg-yellow-600 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
                                                                    title="Mark as Paid"
                                                                >
                                                                    <Banknote size={10} /> Pay
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => setSelectedOrder({ order })}
                                                                className="px-2 py-1 border border-gray-300 text-gray-700 hover:border-black hover:text-black text-[10px] font-bold uppercase tracking-wider"
                                                            >
                                                                View
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {dashboardTab === "behavior" && (
                <div className="space-y-6">
                    {/* User Analytics Tab Content */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                        {[
                            { label: "Total Products", value: mostClickedProducts.length || analytics?.categoryBreakdown?.reduce((s: number, c: any) => s + c.count, 0) || 0, icon: <Package size={16} />, sub: `Views today: ${counters.todayProductViews || 0} live` },
                            { label: "Registered Users", value: userAnalytics?.totalUsers || 0, icon: <User size={16} />, sub: "in database" },
                            { label: "Today's Logins", value: userAnalytics?.todayLogins || 0, icon: <Activity size={16} />, sub: "user sessions" },
                            { label: "Cart Adds Today", value: counters.todayCartAdds || 0, icon: <ShoppingCart size={16} />, sub: "live updates" },
                            { label: "Live Searches Today", value: counters.todaySearches || 0, icon: <Search size={16} />, sub: "user queries" }
                        ].map((item, i) => (
                            <div key={i} className="bg-white border border-gray-200 p-4 sm:p-5 shadow-sm">
                                <div className="flex items-center justify-between text-gray-500 mb-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
                                    {item.icon}
                                </div>
                                <div className="text-xl sm:text-2xl font-light text-black">{item.value}</div>
                                <div className="text-[9px] text-gray-400 font-light mt-1 uppercase tracking-wider">{item.sub}</div>
                            </div>
                        ))}
                    </div>

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Daily Logins Chart */}
                        <div className="bg-white border border-gray-200 p-5 shadow-sm">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-black mb-3">Daily User Logins</h3>
                            <div className="h-64 relative">
                                {userAnalyticsLoading ? (
                                    <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">Loading user analytics...</div>
                                ) : dailyLoginsData.length === 0 ? (
                                    <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400 italic">No login history recorded yet.</div>
                                ) : (
                                    <Line data={loginsChart} options={loginsChartOptions} />
                                )}
                            </div>
                        </div>

                        {/* Product Performance / Most Clicked */}
                        <div className="bg-white border border-gray-200 p-5 shadow-sm">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-black mb-3">Most Clicked Products</h3>
                            <div className="h-64 relative">
                                {mostClickedLoading ? (
                                    <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">Loading click data...</div>
                                ) : mostClickedProducts.length === 0 ? (
                                    <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400 italic">No view clicks registered yet.</div>
                                ) : (
                                    <Bar data={mostClickedChart} options={mostClickedChartOptions} />
                                )}
                            </div>
                        </div>

                        {/* Category Sales Breakdown */}
                        <div className="bg-white border border-gray-200 p-5 shadow-sm">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-black mb-3">Category Distribution</h3>
                            <div className="h-64 relative flex items-center justify-center">
                                {categoryBreakdown.length === 0 ? (
                                    <div className="text-xs text-gray-400 italic">No products categorized.</div>
                                ) : (
                                    <div className="w-56 h-56">
                                        <Doughnut data={doughnutChart} options={{ responsive: true, maintainAspectRatio: false }} />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Monthly Sales / Revenue History */}
                        <div className="bg-white border border-gray-200 p-5 shadow-sm">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-black mb-3">Revenue History (Monthly)</h3>
                            <div className="h-64 relative">
                                <Line data={salesChart} options={chartOptions} />
                            </div>
                        </div>
                    </div>

                    {/* Top Selling Products List */}
                    <div className="bg-white border border-gray-200 p-6 shadow-sm">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-black mb-4">Top Performing Products (Sales)</h3>
                        {analytics.topProducts?.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {analytics.topProducts.map((prod: any, idx: number) => (
                                    <div key={idx} className="border border-gray-100 p-4 rounded flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-50 flex items-center justify-center text-xs font-bold text-gray-500 rounded border border-gray-100">
                                            #{idx + 1}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-xs font-bold text-black truncate" title={prod.name || prod._id}>{prod.name || `ID: ${prod._id || ''}`}</h4>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">Sold: {prod.sold} units</p>
                                            <p className="text-[10px] text-black font-semibold mt-0.5">{currency} {(prod.revenue || 0).toLocaleString("en-IN")}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-gray-400 font-light italic">No product sales recorded yet.</p>
                        )}
                    </div>
                </div>
            )}

            {dashboardTab === "traffic" && (
                <div className="space-y-6">
                    {vercelLoading ? (
                        <div className="flex items-center justify-center min-h-64">
                            <div className="text-center">
                                <div className="w-10 h-10 border-4 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-3" />
                                <p className="text-xs text-gray-500 font-light uppercase tracking-wider">Loading traffic data…</p>
                            </div>
                        </div>
                    ) : !vercelAnalytics ? (
                        <div className="bg-gray-50 border border-gray-200 p-8 text-center max-w-xl mx-auto shadow-sm">
                            <AlertCircle className="mx-auto text-gray-400 mb-3 animate-bounce" size={40} />
                            <h3 className="text-sm font-bold text-black uppercase tracking-wider mb-2">Vercel Analytics Not Configured</h3>
                            <p className="text-xs text-gray-600 font-light leading-relaxed mb-4">
                                To fetch real-time web traffic statistics in this dashboard, please make sure to add your Vercel credentials to the backend `.env` file:
                            </p>
                            <div className="bg-white p-3 border border-gray-200 text-left font-mono text-[10px] text-gray-700 space-y-1.5 overflow-x-auto rounded select-all">
                                <div>VERCEL_ACCESS_TOKEN="your_access_token_here"</div>
                                <div>VERCEL_PROJECT_ID="your_project_id_here"</div>
                                <div>VERCEL_TEAM_ID="your_team_id_here_if_applicable"</div>
                            </div>
                            <button
                                onClick={fetchVercelAnalyticsData}
                                className="mt-5 px-4 py-2 bg-black hover:bg-gray-800 text-white text-xs uppercase tracking-wider font-semibold transition-all"
                            >
                                Retry Connection
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Key Stats Cards */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {[
                                    {
                                        label: "Total Page Views",
                                        value: vercelAnalytics.byDay?.reduce((sum: number, d: any) => sum + (d.pageviews || 0), 0) || 0,
                                        icon: <Eye size={16} />,
                                        sub: "Last 7 days"
                                    },
                                    {
                                        label: "Unique Visitors",
                                        value: vercelAnalytics.byDay?.reduce((sum: number, d: any) => sum + (d.visitors || 0), 0) || 0,
                                        icon: <User size={16} />,
                                        sub: "Last 7 days"
                                    },
                                    {
                                        label: "Top Page Path",
                                        value: vercelAnalytics.byPath?.[0]?.requestPath || vercelAnalytics.byPath?.[0]?.route || "—",
                                        icon: <MapPin size={16} />,
                                        sub: `${vercelAnalytics.byPath?.[0]?.pageviews || 0} page views`
                                    },
                                    {
                                        label: "Primary Device",
                                        value: vercelAnalytics.byDevice?.[0]?.deviceType || vercelAnalytics.byDevice?.[0]?.device || "—",
                                        icon: <Activity size={16} />,
                                        sub: `${vercelAnalytics.byDevice?.[0]?.pageviews || 0} page views`
                                    }
                                ].map((item, idx) => (
                                    <div key={idx} className="bg-white border border-gray-200 p-5 shadow-sm">
                                        <div className="flex items-center justify-between text-gray-500 mb-2">
                                            <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
                                            {item.icon}
                                        </div>
                                        <div className="text-xl sm:text-2xl font-light text-black truncate">{item.value}</div>
                                        <div className="text-[9px] text-gray-400 font-light mt-1 uppercase tracking-wider">{item.sub}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Charts & Lists Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Traffic Trend Chart */}
                                <div className="bg-white border border-gray-200 p-5 shadow-sm">
                                    <h3 className="text-xs font-semibold uppercase tracking-wider text-black mb-3">Daily Page Views & Visitors</h3>
                                    <div className="h-64 relative">
                                        <Line
                                            data={{
                                                labels: (vercelAnalytics.byDay || []).map((d: any, index: number, arr: any[]) => {
                                                    const rawDate = d.day || d.date || d.key || d.timestamp || d.time || d.period || d.start;
                                                    if (rawDate) {
                                                        let dateObj: Date;
                                                        if (typeof rawDate === 'number') {
                                                            dateObj = new Date(rawDate);
                                                        } else {
                                                            const dateStr = String(rawDate);
                                                            dateObj = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`);
                                                        }
                                                        if (!isNaN(dateObj.getTime())) {
                                                            return `${dateObj.getDate()} ${MONTH_NAMES[dateObj.getMonth()]}`;
                                                        }
                                                        return String(rawDate);
                                                    }
                                                    const fallbackDate = new Date();
                                                    fallbackDate.setDate(fallbackDate.getDate() - (arr.length - 1 - index));
                                                    return `${fallbackDate.getDate()} ${MONTH_NAMES[fallbackDate.getMonth()]}`;
                                                }),
                                                datasets: [
                                                    {
                                                        label: "Page Views",
                                                        data: (vercelAnalytics.byDay || []).map((d: any) => d.pageviews || 0),
                                                        borderColor: "#000",
                                                        backgroundColor: "rgba(0,0,0,0.01)",
                                                        tension: 0.4,
                                                        fill: true,
                                                        pointBackgroundColor: "#000",
                                                        pointBorderColor: "#fff",
                                                        pointBorderWidth: 2,
                                                        pointRadius: 3,
                                                    },
                                                    {
                                                        label: "Unique Visitors",
                                                        data: (vercelAnalytics.byDay || []).map((d: any) => d.visitors || 0),
                                                        borderColor: "#3B82F6",
                                                        backgroundColor: "rgba(59, 130, 246, 0.01)",
                                                        tension: 0.4,
                                                        fill: true,
                                                        pointBackgroundColor: "#3B82F6",
                                                        pointBorderColor: "#fff",
                                                        pointBorderWidth: 2,
                                                        pointRadius: 3,
                                                    }
                                                ]
                                            }}
                                            options={vercelChartOptions}
                                        />
                                    </div>
                                </div>

                                {/* Devices Share Chart */}
                                <div className="bg-white border border-gray-200 p-5 shadow-sm">
                                    <h3 className="text-xs font-semibold uppercase tracking-wider text-black mb-3">Device Share</h3>
                                    <div className="h-64 relative flex items-center justify-center">
                                        {(!vercelAnalytics.byDevice || vercelAnalytics.byDevice.length === 0) ? (
                                            <div className="text-xs text-gray-400 italic">No device data.</div>
                                        ) : (
                                            <div className="w-56 h-56">
                                                <Doughnut
                                                    data={{
                                                        labels: vercelAnalytics.byDevice.map((d: any) => d.deviceType || d.device || "Unknown"),
                                                        datasets: [{
                                                            data: vercelAnalytics.byDevice.map((d: any) => d.pageviews || 0),
                                                            backgroundColor: ["#000000", "#3B82F6", "#10B981", "#F59E0B", "#EF4444"],
                                                            borderWidth: 2,
                                                            borderColor: "#fff",
                                                        }],
                                                    }}
                                                    options={{ responsive: true, maintainAspectRatio: false }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Top Countries */}
                                <div className="bg-white border border-gray-200 p-5 shadow-sm">
                                    <h3 className="text-xs font-semibold uppercase tracking-wider text-black mb-4">Top Countries</h3>
                                    {vercelAnalytics.byCountry?.length > 0 ? (
                                        <div className="space-y-3">
                                            {vercelAnalytics.byCountry.map((item: any, idx: number) => {
                                                let countryName = item.country || "Unknown";
                                                if (countryName && countryName !== "Unknown") {
                                                    try {
                                                        const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
                                                        countryName = regionNames.of(countryName.toUpperCase()) || countryName;
                                                    } catch {
                                                        // Fallback
                                                    }
                                                }
                                                const views = item.pageviews || 0;
                                                const visitors = item.visitors || 0;
                                                return (
                                                    <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-gray-50 last:border-0">
                                                        <span className="font-medium text-gray-800">{countryName}</span>
                                                        <span className="text-gray-500 font-semibold">{views} views ({visitors} visitors)</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-400 font-light italic">No geographic data available.</p>
                                    )}
                                </div>

                                {/* Referrers */}
                                <div className="bg-white border border-gray-200 p-5 shadow-sm">
                                    <h3 className="text-xs font-semibold uppercase tracking-wider text-black mb-4">Traffic Sources</h3>
                                    {vercelAnalytics.byReferrer?.length > 0 ? (
                                        <div className="space-y-3">
                                            {vercelAnalytics.byReferrer.map((item: any, idx: number) => {
                                                const referrer = item.referrerHostname || "Direct / Organic";
                                                const views = item.pageviews || 0;
                                                return (
                                                    <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-gray-50 last:border-0">
                                                        <span className="font-medium text-gray-800 truncate max-w-[70%]">{referrer}</span>
                                                        <span className="text-gray-500 font-semibold">{views} views</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-400 font-light italic">No referral source data available.</p>
                                    )}
                                </div>

                                {/* Paths table */}
                                <div className="bg-white border border-gray-200 shadow-sm overflow-hidden col-span-1 lg:col-span-2">
                                    <div className="p-5 border-b border-gray-100">
                                        <h3 className="text-xs font-semibold uppercase tracking-wider text-black">Top Pages & Routes</h3>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs border-collapse font-sans">
                                            <thead>
                                                <tr className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px] font-bold border-b border-gray-100">
                                                    <th className="p-4 font-semibold">Path</th>
                                                    <th className="p-4 font-semibold">Page Views</th>
                                                    <th className="p-4 font-semibold">Unique Visitors</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {vercelAnalytics.byPath?.map((item: any, idx: number) => {
                                                    const path = item.requestPath || item.route || "/";
                                                    const views = item.pageviews || 0;
                                                    const visitors = item.visitors || 0;
                                                    return (
                                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                            <td className="p-4 font-mono font-bold text-gray-900">{path}</td>
                                                            <td className="p-4 text-gray-700 font-medium">{views}</td>
                                                            <td className="p-4 text-gray-500">{visitors}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Order detail overlay */}
            {selectedOrder && (
                <OrderDetailModal
                    order={selectedOrder.order}
                    orderNumber={selectedOrder.order._id?.slice(-8).toUpperCase()}
                    onClose={() => setSelectedOrder(null)}
                />
            )}
        </div>
    );
};

export default function AdminDashboardPage() {
    const { token, logout } = useAuth();
    const [adminData, setAdminData] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchAdminData = async () => {
            if (!token || !isTokenValid(token)) {
                toast.error("Session expired. Please login again.");
                logout();
                return;
            }
            try {
                const decoded = jwtDecode<{ id: string }>(token);
                const res = await axios.get(`${backendUrl}/api/v1/user/profile/${decoded.id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.data.success) setAdminData(res.data.user);
            } catch (error: any) {
                if (error.response?.status === 401) {
                    toast.error("Session expired. Please login again.");
                    logout();
                    router.push("/");
                }
            }
        };
        if (token) fetchAdminData();
    }, [token, router, logout]);

    return (
        <div className="min-h-screen bg-white">
            <main className="py-2">
                <AnalyticsTab adminData={adminData} />
            </main>
        </div>
    );
}
