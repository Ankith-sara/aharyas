'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { api } from "./api";
import { User } from "@aharyas/types";

interface AuthContextType {
  token: string;
  setToken: (token: string) => void;
  user: User | null;
  userProfile: User | null;
  setUserProfile: React.Dispatch<React.SetStateAction<User | null>>;
  logout: () => void;
  backendUrl: string;
}

export const AuthContext = createContext<AuthContextType>({
  token: "",
  setToken: () => {},
  user: null,
  userProfile: null,
  setUserProfile: () => {},
  logout: () => {},
  backendUrl: "",
});

const safeRemove = (key: string) => {
  try {
    if (typeof window !== "undefined") {
      localStorage.removeItem(key);
    }
  } catch (err) {
    console.error("safeRemove error", err);
  }
};

export const AuthContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setTokenState] = useState<string>("");
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const router = useRouter();
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const setToken = useCallback((t: string) => {
    setTokenState(t);
    if (t) {
      api.defaults.headers.common["Authorization"] = `Bearer ${t}`;
      if (typeof window !== "undefined") {
        localStorage.setItem("token", t);
      }
    } else {
      delete api.defaults.headers.common["Authorization"];
      safeRemove("token");
    }
  }, []);

  const getUserProfile = useCallback(async (userToken: string) => {
    try {
      const { data } = await api.get("/api/v1/user/profile", {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      if (data.success && isMounted.current) {
        setUserProfile(data.user);
      }
    } catch (err) {
      console.error("getUserProfile error", err);
    }
  }, []);

  const logout = useCallback(() => {
    setToken("");
    safeRemove("userId");
    setUserProfile(null);
    toast.success("You have been signed out");
    router.push("/login");
  }, [setToken, router]);

  // 401 interceptor
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (res) => res,
      (error) => {
        if (error.response?.status === 401 && token) {
          setToken("");
          safeRemove("userId");
          setUserProfile(null);
          toast.error("Your session has expired. Please sign in again.");
          router.push("/login");
        }
        return Promise.reject(error);
      }
    );
    return () => api.interceptors.response.eject(interceptor);
  }, [token, router, setToken]);

  // Rehydrate token on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("token");
      if (storedToken && !token) {
        api.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
        setTokenState(storedToken);
        getUserProfile(storedToken);
      }
    }
  }, []);

  useEffect(() => {
    if (token) {
      getUserProfile(token);
    } else {
      setUserProfile(null);
    }
  }, [token, getUserProfile]);

  const value = {
    token,
    setToken,
    user: userProfile,
    userProfile,
    setUserProfile,
    logout,
    backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
