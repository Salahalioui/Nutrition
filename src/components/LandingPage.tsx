import { useAuth } from "../lib/AuthContext";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";
import { Activity, Apple, Calendar, Users } from "lucide-react";

export function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col animate-in fade-in duration-500">
      <section className="py-20 md:py-32 flex flex-col items-center text-center space-y-8">
        <div className="bg-[#047857]/10 p-4 rounded-full mb-4 inline-flex items-center justify-center">
          <Activity className="h-10 w-10 text-[#064E3B]" />
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-[#064E3B] max-w-4xl">
          Fuel Your Performance with <span className="text-[#F59E0B]">Dzair</span> Nutrition
        </h1>
        <p className="text-xl md:text-2xl text-slate-600 max-w-2xl text-balance">
          The first AI sports nutrition platform specifically designed for the Algerian athlete, aligning your training load with culturally aware, perfectly timed meal plans.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Link to={user ? "/dashboard" : "/login"}>
            <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg bg-[#064E3B] font-bold text-white hover:bg-[#047857] rounded-xl shadow-sm">
              Get Started
            </Button>
          </Link>
        </div>
      </section>

      <section className="py-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col space-y-4">
          <div className="h-12 w-12 bg-[#F59E0B]/10 rounded-xl flex items-center justify-center">
            <Apple className="h-6 w-6 text-[#F59E0B]" />
          </div>
          <h3 className="text-2xl font-bold text-[#064E3B]">Cultural AI Diet</h3>
          <p className="text-slate-600">Advanced AI suggesting optimized portions of Deglet Nour, Couscous, and Chorba based on your carb-loading and recovery needs.</p>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col space-y-4">
          <div className="h-12 w-12 bg-[#047857]/10 rounded-xl flex items-center justify-center">
            <Calendar className="h-6 w-6 text-[#047857]" />
          </div>
          <h3 className="text-2xl font-bold text-[#064E3B]">Training Sync</h3>
          <p className="text-slate-600">Coaches input macro-cycles and intensity. Your meal plan automatically adjusts to match the exact energy requirements of the day.</p>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col space-y-4">
          <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-[#064E3B]">Expert Review</h3>
          <p className="text-slate-600">Nutritionists and team staff can oversee, tweak, and approve the generated plans before they reach the players.</p>
        </div>
      </section>
    </div>
  );
}
