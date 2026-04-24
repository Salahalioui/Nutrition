import { useAuth } from "../lib/AuthContext";
import { signInWithGoogle } from "../lib/firebase";
import { Button } from "./ui/button";
import { Navigate, useNavigate } from "react-router-dom";
import { Activity } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export function LoginPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  if (user && profile?.role) {
    return <Navigate to="/dashboard" replace />;
  }
  
  if (user && !profile?.role) {
    return <Navigate to="/onboarding" replace />;
  }

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
      navigate("/onboarding");
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-slate-800">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="mx-auto w-16 h-16 bg-[#F59E0B] rounded flex items-center justify-center font-bold text-4xl text-[#064E3B]">V</div>
        <h1 className="text-3xl font-bold tracking-tighter text-[#064E3B]">{t('Sign In')}</h1>
        <p className="text-slate-500">{t('Access your personalized Algerian sports nutrition plan.')}</p>
        
        <Button 
          className="w-full bg-[#064E3B] text-white py-6 text-lg hover:bg-[#047857] shadow-sm rounded-xl font-bold" 
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          {loading ? t('Signing in...') : t('Continue with Google')}
        </Button>
      </div>
    </div>
  );
}
