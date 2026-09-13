import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

const AuthContext = createContext(null);

function getAuthError(message) {
    if (!supabase) {
        return new Error("Authentication is not configured. Set the Supabase frontend environment variables.");
    }
    return new Error(message || "Authentication request failed.");
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadProfile = async (currentUser) => {
        if (!currentUser || !supabase) {
            setProfile(null);
            return;
        }

        const { data, error } = await supabase
            .from("profiles")
            .select("id,full_name,role,created_at")
            .eq("id", currentUser.id)
            .maybeSingle();

        if (error) {
            setProfile(null);
            return;
        }

        if (data) {
            setProfile(data);
            return;
        }

        const { data: createdProfile } = await supabase
            .from("profiles")
            .insert({
                id: currentUser.id,
                full_name: currentUser.user_metadata?.full_name || "",
                role: "passenger",
            })
            .select("id,full_name,role,created_at")
            .single();

        setProfile(createdProfile || null);
    };

    useEffect(() => {
        if (!supabase) {
            setLoading(false);
            return undefined;
        }

        let active = true;

        supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
            if (!active) return;
            setSession(currentSession);
            setUser(currentSession?.user || null);
            loadProfile(currentSession?.user).finally(() => {
                if (active) setLoading(false);
            });
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, currentSession) => {
                if (!active) return;
                setSession(currentSession);
                setUser(currentSession?.user || null);
                setLoading(true);
                loadProfile(currentSession?.user).finally(() => {
                    if (active) setLoading(false);
                });
            }
        );

        return () => {
            active = false;
            subscription.unsubscribe();
        };
    }, []);

    const signIn = async (email, password) => {
        if (!supabase) throw getAuthError();
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw getAuthError(error.message);
        return data;
    };

    const signUp = async (fullName, email, password) => {
        if (!supabase) throw getAuthError();
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName } },
        });
        if (error) throw getAuthError(error.message);
        return data;
    };

    const signOut = async () => {
        if (!supabase) return;
        const { error } = await supabase.auth.signOut();
        if (error) throw getAuthError(error.message);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                session,
                profile,
                role: profile?.role || null,
                loading,
                signIn,
                signUp,
                signOut,
                refreshProfile: () => loadProfile(user),
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const value = useContext(AuthContext);
    if (!value) throw new Error("useAuth must be used inside AuthProvider");
    return value;
}
