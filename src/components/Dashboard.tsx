import { useAuth } from "../lib/AuthContext";
import { Navigate } from "react-router-dom";
import { AthleteDashboard } from "./AthleteDashboard";
import { CoachDashboard } from "./CoachDashboard";
import { NutritionistDashboard } from "./NutritionistDashboard";
import { Skeleton } from "./ui/skeleton";

export function Dashboard() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!profile?.role || (!profile.weight && profile.role === 'athlete')) return <Navigate to="/onboarding" replace />;

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-8 border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back, {profile.displayName.split(' ')[0]}
        </h1>
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">Here is your customized view for {profile.role}s.</p>
      </div>

      {profile.role === 'athlete' && <AthleteDashboard />}
      {profile.role === 'coach' && <CoachDashboard />}
      {profile.role === 'nutritionist' && <NutritionistDashboard />}
    </div>
  );
}
