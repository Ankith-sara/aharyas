import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { api } from "./api";

export const AuthContext = createContext();

// Safe JSON helpers
const safeRemove = (key) => {
    try {
        localStorage.removeItem(key);
    } catch (err) {
        console.error("safeRemove error", err);
    }
};

const AuthContextProvider = ({ children }) => {
    const [token, setTokenState]   = useState("");
    const [userProfile, setUserProfile] = useState(null);
    const navigate  = useNavigate();
    const isMounted = useRef(true);

    useEffect(() => { isMounted.current = true; return () => { isMounted.current = false; }; }, []);

    const setToken = useCallback((t) => {
        setTokenState(t);
        if (t) {
            api.defaults.headers.common["Authorization"] = `Bearer ${t}`;
            localStorage.setItem("token", t);
        } else {
            delete api.defaults.headers.common["Authorization"];
            safeRemove("token");
        }
    }, []);

    // 401 interceptor lives here – only needs token + navigate
    useEffect(() => {
        const interceptor = api.interceptors.response.use(
            (res) => res,
            (error) => {
                if (error.response?.status === 401 && token) {
                    setToken("");
                    safeRemove("userId");
                    setUserProfile(null);
                    toast.error("Your session has expired. Please sign in again.");
                    navigate("/login");
                }
                return Promise.reject(error);
            }
        );
        return () => api.interceptors.response.eject(interceptor);
    }, [token, navigate, setToken]);

    const getUserProfile = useCallback(async (userToken) => {
        try {
            const { data } = await api.get("/api/v1/user/profile", {
                headers: { Authorization: `Bearer ${userToken}` },
            });
            if (data.success && isMounted.current) setUserProfile(data.user);
        } catch (err) {
            console.error("getUserProfile error", err);
        }
    }, []);

    const logout = useCallback(() => {
        setToken("");
        safeRemove("userId");
        setUserProfile(null);
        toast.success("You have been signed out");
        navigate("/login");
    }, [setToken, navigate]);

    // Rehydrate token on mount
    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken && !token) {
            api.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
            setTokenState(storedToken);
            getUserProfile(storedToken);
        }
    }, []);

    useEffect(() => {
        if (token)  getUserProfile(token);
        else        setUserProfile(null);
    }, [token, getUserProfile]);

    const value = {
        token, setToken,
        userProfile, setUserProfile,
        logout,
        backendUrl: import.meta.env.VITE_BACKEND_URL,
        navigate,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContextProvider;

export const useAuth = () => useContext(AuthContext);