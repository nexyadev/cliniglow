import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface Profile {
  id: string;
  clinic_id: string | null;
  role: string;
  full_name: string | null;
}

interface Clinic {
  id: string;
  name: string;
  subscription_status: string;
  trial_end: string | null;
  plan_expires_at: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  clinic: Clinic | null;
  isLoading: boolean;
  isProfileLoaded: boolean;
  isPlatformAdmin: boolean;
  clinicId: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    clinicName: string,
    whatsapp?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshClinic: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const ADMIN_EMAIL = "eduardograbowski10@gmail.com";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);

  const isPlatformAdmin = user?.email === ADMIN_EMAIL;
  const clinicId = profile?.clinic_id || null;

  // 🔥 FETCH PROFILE + CLINIC
  const fetchProfile = async (userId: string) => {
    try {
      setIsProfileLoaded(false);

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (profileError) {
        console.error("Erro profile:", profileError);
        setProfile(null);
        setClinic(null);
        return;
      }

      setProfile(profileData || null);

      if (profileData?.clinic_id) {
        const { data: clinicData, error: clinicError } = await supabase
          .from("clinics")
          .select("*")
          .eq("id", profileData.clinic_id)
          .maybeSingle();

        if (clinicError) {
          console.error("Erro clinic:", clinicError);
          setClinic(null);
          return;
        }

        setClinic(clinicData || null);
      } else {
        setClinic(null);
      }
    } catch (err) {
      console.error("Erro fetchProfile:", err);
      setProfile(null);
      setClinic(null);
    } finally {
      setIsProfileLoaded(true);
    }
  };

  useEffect(() => {
    let mounted = true;

    // 🔥 LISTENER AUTH — sem await para não travar
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;

        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          // ✅ dispara sem await e garante isLoading=false no finally
          fetchProfile(currentUser.id).finally(() => {
            if (mounted) setIsLoading(false);
          });
        } else {
          setProfile(null);
          setClinic(null);
          setIsProfileLoaded(true);
          if (mounted) setIsLoading(false);
        }
      }
    );

    // 🔥 CHECK INICIAL
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session && mounted) {
        setUser(null);
        setProfile(null);
        setClinic(null);
        setIsProfileLoaded(true);
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // 🔐 LOGIN
  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Erro login:", error);
      throw error;
    }
  };

  // 🆕 REGISTER
  const register = async (
    name: string,
    email: string,
    password: string,
    clinicName: string,
    whatsapp?: string
  ) => {
    try {
      if (!name || !email || !password || !clinicName) {
        throw new Error("Preencha todos os campos");
      }

      // 1. SIGNUP
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error("Erro signup:", error);
        throw error;
      }

      if (!data.user) {
        throw new Error("Usuário não criado");
      }

      const userId = data.user.id;

      // 2. CLINIC
      const { data: clinicData, error: clinicError } = await supabase
        .from("clinics")
        .insert({
          name: clinicName,
          owner_id: userId,
          subscription_status: "trial",
          trial_end: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          ).toISOString(),
          whatsapp: whatsapp || null,
        })
        .select()
        .single();

      if (clinicError || !clinicData) {
        console.error("Erro clínica:", clinicError);
        throw new Error("Erro ao criar clínica");
      }

      // 3. PROFILE
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: userId,
          full_name: name,
          role: "admin",
          clinic_id: clinicData.id,
        });

      if (profileError) {
        console.error("Erro profile:", profileError);
        throw new Error("Erro ao criar perfil");
      }
    } catch (err) {
      console.error("REGISTER ERROR:", err);
      throw err;
    }
  };

  // 🚪 LOGOUT
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setClinic(null);
    setIsProfileLoaded(false);
  };

  // 🔄 REFRESH CLINIC
  const refreshClinic = async () => {
    if (!clinicId) return;

    const { data, error } = await supabase
      .from("clinics")
      .select("*")
      .eq("id", clinicId)
      .maybeSingle();

    if (error) {
      console.error("Erro refresh clinic:", error);
      return;
    }

    if (data) setClinic(data);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        clinic,
        isLoading,
        isProfileLoaded,
        isPlatformAdmin,
        clinicId,
        login,
        register,
        logout,
        refreshClinic,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}