import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Bot, Plus, ArrowRight, Activity, Flame, FileText, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { extractMealInfo } from "../lib/gemini";
import { addDoc, collection, serverTimestamp, query, orderBy, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../lib/AuthContext";
import Markdown from 'react-markdown';
import { useTranslation } from "react-i18next";

export function AthleteDashboard() {
  const { user, profile } = useAuth();
  const { t } = useTranslation();
  const [mealInput, setMealInput] = useState("");
  const [isLogging, setIsLogging] = useState(false);
  const [open, setOpen] = useState(false);
  const [nextEvent, setNextEvent] = useState<any>(null);
  const [mealPlan, setMealPlan] = useState<any>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [todayMacros, setTodayMacros] = useState({ calories: 0, protein: 0, carbs: 0, fats: 0 });

  useEffect(() => {
    async function fetchNextEvent() {
      if (!profile?.teamId) return;
      try {
        const eventsQuery = query(
          collection(db, `teams/${profile.teamId}/events`),
          orderBy("date", "asc")
        );
        const evSnap = await getDocs(eventsQuery);
        const events = evSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
        // simple logic: find first event on or after today
        const today = new Date().toISOString().split('T')[0];
        const upcoming = events.find(e => e.date >= today);
        if (upcoming) setNextEvent(upcoming);
      } catch (e) {
        console.error("Failed to fetch next event", e);
      }
    }
    fetchNextEvent();
  }, [profile?.teamId]);

  useEffect(() => {
    async function fetchMealPlan() {
      if (!user) return;
      setLoadingPlan(true);
      try {
        // Fetch tomorrow's plan as standard practice
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split('T')[0];

        const planDoc = await getDoc(doc(db, `users/${user.uid}/mealPlans`, dateStr));
        if (planDoc.exists()) {
          setMealPlan(planDoc.data());
        }

        // Fetch today's meals to calculate current macros
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const logsRef = collection(db, "users", user.uid, "mealLogs");
        // For simplicity, we just fetch all and filter in JS if not indexed, 
        // since setting up composite indexes might fail without a link
        const snap = await getDocs(query(logsRef, orderBy("createdAt", "desc")));
        
        let cals = 0; let p = 0; let c = 0; let f = 0;
        snap.docs.forEach(doc => {
          const d = doc.data();
          if (d.createdAt && d.createdAt.toDate() >= todayStart) {
            cals += d.calories || 0;
            p += d.protein || 0;
            c += d.carbs || 0;
            f += d.fats || 0;
          }
        });
        setTodayMacros({ calories: cals, protein: p, carbs: c, fats: f });

      } catch (e) {
        console.error("Failed to fetch data", e);
      } finally {
        setLoadingPlan(false);
      }
    }
    fetchMealPlan();
  }, [user]);

  const handleLogMeal = async () => {
    if (!mealInput.trim() || !user) return;
    try {
      setIsLogging(true);
      const { calories, protein, carbs, fats, summary } = await extractMealInfo(mealInput);
      
      await addDoc(collection(db, "users", user.uid, "mealLogs"), {
        description: summary,
        calories,
        protein,
        carbs,
        fats,
        createdAt: serverTimestamp(),
      });
      
      setTodayMacros(prev => ({
        calories: prev.calories + calories,
        protein: prev.protein + protein,
        carbs: prev.carbs + carbs,
        fats: prev.fats + fats,
      }));

      setMealInput("");
      setOpen(false);
      // Optional: Add toast notification here
      alert(`${t('Logged:')} ${summary} (${calories} kcal)`);
    } catch (e) {
      console.error(e);
      alert(t("Failed to analyze meal. Please try again."));
    } finally {
      setIsLogging(false);
    }
  };

  const getPhaseName = () => {
    if (nextEvent?.type === 'Match') return t('Carb-Loading Phase');
    if (nextEvent?.type === 'Recovery') return t('Recovery Phase');
    if (nextEvent?.type === 'Strength') return t('Hypertrophy/Strength Phase');
    return t('Maintenance Phase');
  };

  const getPhaseDescription = () => {
    if (nextEvent?.type === 'Match') return t("Your AI plan suggests increasing carbohydrate intake by 20% today. Focus on complex carbs like Tlitli or Rechta for dinner.");
    if (nextEvent?.type === 'Recovery') return t("Focus on hydration and high-quality protein to repair muscle tissues after the recent match.");
    if (nextEvent?.type === 'Strength') return t("Protein synthesis is key today. Ensure 1.6-2.0g per kg of body weight.");
    return t("Your training intensity is moderate. Ensure adequate protein intake for recovery and keep your hydration levels optimal.");
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <Card className="bg-[#064E3B] text-white border-none rounded-2xl overflow-hidden relative shadow-lg rtl:text-right">
        <div className="absolute ltr:right-0 rtl:left-0 top-0 opacity-10">
          <Activity className="w-64 h-64 ltr:-mr-16 rtl:-ml-16 -mt-16" />
        </div>
        <CardContent className="p-8 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <p className="text-[#F59E0B] font-semibold text-xs tracking-widest uppercase mb-1">
                {nextEvent ? `${t('Next Event:')} ${t(nextEvent.type)} ${t('on')} ${nextEvent.date}` : t("No Upcoming Events")}
              </p>
              <h2 className="text-3xl font-bold">
                {getPhaseName()}
              </h2>
              <p className="text-slate-200 max-w-xl mt-2 text-sm">
                {getPhaseDescription()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 rtl:text-right">
        {/* Plan Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-800">{t('Your AI Nutrition Plan (Tomorrow)')}</h3>
            {mealPlan && (
              <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest flex items-center ${mealPlan.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {mealPlan.status === 'Approved' ? <Bot className="h-3 w-3 ltr:mr-1 rtl:ml-1" /> : <Loader2 className="h-3 w-3 ltr:mr-1 rtl:ml-1 animate-spin" />} 
                {mealPlan.status === 'Approved' ? t('Approved by Nutritionist') : t('Draft Pending Review')}
              </span>
            )}
          </div>

          <Card className="rounded-2xl border-slate-200 shadow-sm border overflow-hidden min-h-[400px]">
            <CardContent className="p-6">
              {loadingPlan ? (
                <div className="flex justify-center items-center h-full min-h-[200px]">
                  <Loader2 className="w-8 h-8 animate-spin text-[#064E3B]" />
                </div>
              ) : mealPlan ? (
                <div className={`prose prose-slate prose-headings:text-[#064E3B] max-w-none prose-h3:text-lg prose-h3:font-bold prose-h3:mt-6 prose-h3:mb-3 prose-h3:flex prose-h3:items-center prose-h3:gap-2 prose-li:marker:text-[#F59E0B] prose-ul:my-2 prose-li:my-1 text-sm ${t('dir') === 'rtl' ? 'rtl-markdown text-right marker:mr-2' : ''}`}>
                  <Markdown>{mealPlan.content}</Markdown>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center text-slate-500 py-16">
                  <FileText className="w-16 h-16 opacity-20 mb-4" />
                  <p className="text-lg font-medium text-slate-700">{t('No Plan Ready')}</p>
                  <p className="text-sm mt-1 max-w-sm">{t('Your nutritionist has not yet published your AI-powered meal plan for tomorrow. Check back later.')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar / Quick Log */}
        <div className="space-y-6">
          <Card className="rounded-2xl border-slate-200 shadow-sm border">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-4">
              <CardTitle className="text-sm font-bold uppercase text-slate-500 tracking-wider text-center">{t('Daily Macros')}</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase">{t('Calories')}</p>
                    <p className="text-3xl font-black text-[#064E3B]">{todayMacros.calories} <span className="text-sm font-bold text-slate-400">/ 2400</span></p>
                  </div>
                  <Flame className="text-[#F59E0B] h-6 w-6 mb-1" />
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-[#F59E0B] h-2 rounded-full transition-all" style={{ width: `${Math.min((todayMacros.calories / 2400) * 100, 100)}%` }}></div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 pt-4">
                  <MacroMini label={t('Protein')} current={todayMacros.protein} target={140} color="bg-blue-500" />
                  <MacroMini label={t('Carbs')} current={todayMacros.carbs} target={300} color="bg-green-500" />
                  <MacroMini label={t('Fats')} current={todayMacros.fats} target={60} color="bg-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button className="w-full py-6 text-sm font-bold flex items-center justify-center rounded-xl bg-[#064E3B] text-white hover:bg-[#047857] shadow-lg shadow-[#064E3B]/20 transition-all uppercase tracking-wider" />}>
              <Plus className="mr-2 h-5 w-5 rtl:ml-2 rtl:mr-0" /> {t('Log a Meal with AI')}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-2xl rtl:text-right">
              <DialogHeader>
                <DialogTitle className="text-[#064E3B] font-bold">{t('Log Meal')}</DialogTitle>
                <DialogDescription className="text-slate-500">
                  {t('Tell our AI what you ate. Be specific for better macro estimates.')}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Textarea
                  placeholder={t('e.g. A bowl of Loubia with a piece of Kesra and a side salad...')}
                  value={mealInput}
                  onChange={(e) => setMealInput(e.target.value)}
                  className="min-h-[100px] resize-none border-slate-200"
                />
              </div>
              <DialogFooter>
                <Button onClick={handleLogMeal} disabled={isLogging} className="w-full bg-[#F59E0B] font-bold text-[#064E3B] hover:text-white hover:bg-[#D97706] rounded-xl shadow-sm">
                  {isLogging ? t("Analyzing...") : t("Analyze & Log")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}

function MacroMini({ label, current, target, color }: any) {
  const percent = Math.min((current/target)*100, 100);
  return (
    <div className="text-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="font-black text-slate-900 mb-2">{current}g</p>
      <div className="w-full bg-slate-100 rounded-full h-1">
        <div className={`${color} h-1 rounded-full transition-all`} style={{ width: `${percent}%` }}></div>
      </div>
    </div>
  )
}
