import { ReactNode, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { signOut } from "../lib/firebase";
import { Button } from "./ui/button";
import { Activity, LogOut, User as UserIcon, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";

export function MainLayout({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
  };

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAF9] text-slate-800 transition-all font-sans">
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white">
        <div className="container flex h-20 max-w-7xl mx-auto items-center justify-between px-8">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-[#F59E0B] rounded flex items-center justify-center font-bold text-[#064E3B]">V</div>
              <span className="text-xl font-bold tracking-tight text-slate-900">VITASPORT</span>
            </Link>
          </div>
          
          <nav className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={toggleLanguage} className="rounded-full hover:bg-slate-100">
              <Globe className="h-5 w-5 text-slate-600" />
            </Button>
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-500 font-medium hidden sm:inline-block uppercase tracking-wider">
                  {profile?.displayName} • {t(profile?.role || '')}
                </span>
                <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
                  <UserIcon className="h-5 w-5 text-slate-600" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleSignOut} className="text-[#F59E0B] border-[#F59E0B]/20 hover:bg-[#F59E0B]/10 font-bold shadow-sm">
                  <LogOut className="h-4 w-4 rtl:ml-2 ltr:mr-2 flex-shrink-0" />
                  <span className="mx-2">{t('Sign Out')}</span>
                </Button>
              </div>
            ) : (
              <Button onClick={() => navigate("/login")} className="bg-[#F59E0B] text-[#064E3B] font-bold rounded-lg shadow-sm hover:shadow-md transition-all hover:bg-[#D97706] hover:text-white px-4">
                {t('Sign In')}
              </Button>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 pb-12 pt-6">
        {children}
      </main>
    </div>
  );
}
