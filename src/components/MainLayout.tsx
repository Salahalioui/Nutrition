import { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { signOut } from "../lib/firebase";
import { Button } from "./ui/button";
import { Activity, LogOut, User as UserIcon } from "lucide-react";

export function MainLayout({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAF9] text-slate-800">
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white">
        <div className="container flex h-20 max-w-7xl mx-auto items-center justify-between px-8">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-[#F59E0B] rounded flex items-center justify-center font-bold text-[#064E3B]">V</div>
              <span className="text-xl font-bold tracking-tight text-slate-900">VITASPORT</span>
            </Link>
          </div>
          
          <nav className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-500 font-medium hidden sm:inline-block uppercase tracking-wider">
                  {profile?.displayName} • {profile?.role}
                </span>
                <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
                  <UserIcon className="h-5 w-5 text-slate-600" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleSignOut} className="text-[#F59E0B] border-[#F59E0B]/20 hover:bg-[#F59E0B]/10 font-bold shadow-sm">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button onClick={() => navigate("/login")} className="bg-[#F59E0B] text-[#064E3B] font-bold rounded-lg shadow-sm hover:shadow-md transition-all hover:bg-[#D97706] hover:text-white">
                Sign In
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
