import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Check, Edit, FileText, Loader2, Plus, Bot } from "lucide-react";
import { Textarea } from "./ui/textarea";
import { useAuth } from "../lib/AuthContext";
import { collection, query, where, getDocs, doc, setDoc, getDoc, orderBy, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { generateMealPlan } from "../lib/gemini";
import { useTranslation } from "react-i18next";

export function NutritionistDashboard() {
  const { profile } = useAuth();
  const { t } = useTranslation();
  const [athletes, setAthletes] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedAthlete, setSelectedAthlete] = useState<any>(null);
  const [mealPlan, setMealPlan] = useState<any>(null);
  const [editorContent, setEditorContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!profile?.teamId) return setLoading(false);
      try {
        setLoading(true);
        // Fetch athletes
        const q = query(
          collection(db, "users"),
          where("teamId", "==", profile.teamId),
          where("role", "==", "athlete")
        );
        const snap = await getDocs(q);
        setAthletes(snap.docs.map(d => ({ id: d.id, ...d.data() })));

        // Fetch team events for context
        const eventsQ = query(
          collection(db, `teams/${profile.teamId}/events`),
          orderBy("date", "asc")
        );
        const evSnap = await getDocs(eventsQ);
        setEvents(evSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [profile?.teamId]);

  const fetchAthletePlan = async (athlete: any) => {
    setSelectedAthlete(athlete);
    setMealPlan(null);
    setEditorContent("");
    
    // We check for tomorrow's plan as a default
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    try {
      const planDoc = await getDoc(doc(db, `users/${athlete.id}/mealPlans`, dateStr));
      if (planDoc.exists()) {
        const data = planDoc.data();
        setMealPlan({ id: planDoc.id, ...data });
        setEditorContent(data.content);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerateAI = async () => {
    if (!selectedAthlete) return;
    setIsGenerating(true);
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      const upcomingEvents = events.filter(e => e.date >= dateStr).slice(0, 3);
      
      const content = await generateMealPlan(selectedAthlete, upcomingEvents, "Create a tailored 1-day plan using mostly local Algerian ingredients.");
      
      setEditorContent(content);
      setMealPlan({ status: "Draft" }); // local representation
    } catch (e) {
      console.error("AI Generation failed", e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApproveAndPublish = async () => {
    if (!selectedAthlete || !editorContent.trim() || !profile) return;
    setIsSaving(true);
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];
      
      await setDoc(doc(db, `users/${selectedAthlete.id}/mealPlans`, dateStr), {
        date: dateStr,
        status: "Approved",
        content: editorContent,
        createdAt: serverTimestamp(),
        nutritionistId: profile.uid || 'unknown'
      });
      
      // Update local state
      setMealPlan({ date: dateStr, status: "Approved", content: editorContent });
    } catch (e) {
      console.error("Save failed", e);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-[#064E3B]" /></div>;
  }
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm rtl:text-right">
        <div>
          <h2 className="text-xl font-bold text-slate-900 leading-tight">{t('AI Plan Review')}</h2>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">{t('Review, tweak, and approve AI generated meal plans before athletes see them.')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 rtl:text-right">
        {/* Pending List */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="rounded-2xl shadow-sm border border-slate-200">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-4">
              <CardTitle className="text-sm font-bold uppercase text-slate-500 tracking-wider text-center">{t('Team Athletes')}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 overflow-y-auto max-h-[500px]">
              <ul className="space-y-2">
                {athletes.length === 0 ? (
                  <p className="text-center text-sm text-slate-500 py-4">{t('No athletes found in your team.')}</p>
                ) : (
                  athletes.map(athlete => (
                    <ReviewItem 
                      key={athlete.id}
                      name={athlete.displayName || athlete.email} 
                      context={athlete.goals || t("Athlete")} 
                      active={selectedAthlete?.id === athlete.id}
                      onClick={() => fetchAthletePlan(athlete)}
                      t={t}
                    />
                  ))
                )}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Editor View */}
        <div className="lg:col-span-2">
          {!selectedAthlete ? (
            <Card className="rounded-2xl shadow-sm border border-slate-200 h-full flex items-center justify-center min-h-[400px]">
              <div className="text-center text-slate-500">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>{t('Select an athlete to view or generate their meal plan.')}</p>
              </div>
            </Card>
          ) : (
            <Card className="rounded-2xl shadow-sm border border-slate-200 h-full flex flex-col overflow-hidden">
              <div className="bg-[#064E3B] text-white p-4 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg leading-tight">{t('Reviewing:')} {selectedAthlete.displayName || selectedAthlete.email}</h3>
                  <p className="text-emerald-300 text-[10px] font-bold uppercase tracking-widest mt-1 flex gap-3">
                    <span>{t('Age:')} {selectedAthlete.age || '?'}</span> <span>{t('Weight:')} {selectedAthlete.weight || '?'}kg</span>
                  </p>
                </div>
                {mealPlan?.status && (
                  <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-0 text-[10px] uppercase font-black px-3 py-1">
                    {t(mealPlan.status)}
                  </Badge>
                )}
              </div>
              
              <div className="flex-1 p-6 flex flex-col gap-4 bg-slate-50 min-h-[500px]">
                {!editorContent ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-200 rounded-xl p-8 text-center">
                    <Bot className="h-12 w-12 mb-3 text-slate-300 mx-auto" />
                    <p className="mb-4 text-center">{t('No plan exists for tomorrow.')}<br/>{t('Generate one using AI based on their upcoming training.')}</p>
                    <Button onClick={handleGenerateAI} disabled={isGenerating} className="bg-[#F59E0B] hover:bg-[#D97706] text-[#064E3B] font-bold">
                      {isGenerating ? <Loader2 className="ltr:mr-2 rtl:ml-2 h-4 w-4 animate-spin" /> : <Bot className="ltr:mr-2 rtl:ml-2 h-4 w-4" />}
                      {t('Generate AI Draft')}
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="bg-white border-2 border-amber-400 p-4 rounded-xl text-sm shadow-sm relative overflow-hidden">
                      <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest absolute top-2 ltr:right-3 rtl:left-3">{t('AI Context')}</span>
                      <p className="text-sm font-semibold text-[#064E3B] mt-2">
                        {t('Plan generated for tomorrow based on athlete stats and upcoming training events.')}
                      </p>
                    </div>
                    
                    <div className="bg-slate-900 rounded-xl p-5 flex flex-col flex-1">
                      <div className="mb-4">
                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{t('Plan Editor Mode')}</span>
                      </div>
                      <Textarea 
                        className={`flex-1 resize-none font-mono text-xs leading-relaxed p-4 bg-white/5 border-white/10 text-white/90 rounded-lg focus-visible:ring-1 focus-visible:ring-emerald-500 focus-visible:border-transparent placeholder:text-white/20 min-h-[300px] ${t('dir') === 'rtl' ? 'rtl-markdown' : ''}`} 
                        value={editorContent}
                        onChange={(e) => setEditorContent(e.target.value)}
                      />
                    </div>
                    
                    <div className="mt-4 flex gap-3">
                      <Button onClick={handleGenerateAI} disabled={isGenerating} variant="outline" className="flex-1 py-4 text-[11px] font-bold text-slate-700 hover:bg-slate-100 rounded-lg uppercase">
                        {isGenerating ? <Loader2 className="ltr:mr-2 rtl:ml-2 h-3 w-3 animate-spin" /> : <Edit className="ltr:mr-2 rtl:ml-2 h-3 w-3" />} {t('Ask AI to Revise')}
                      </Button>
                      <Button onClick={handleApproveAndPublish} disabled={isSaving} className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold uppercase transition-all shadow-sm">
                        {isSaving ? <Loader2 className="ltr:mr-2 rtl:ml-2 h-3 w-3 animate-spin" /> : <Check className="ltr:mr-2 rtl:ml-2 h-3 w-3" />} {t('Approve & Publish')}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewItem({ name, context, active = false, onClick, t }: any) {
  return (
    <li onClick={onClick} className={`p-4 rounded-xl cursor-pointer transition-all border ${active ? 'bg-[#064E3B] text-white border-[#064E3B] shadow-md' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700 hover:shadow-sm'}`}>
      <div className="flex justify-between items-center mb-1">
        <span className="font-bold">{name}</span>
        <span className={`text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full ${active ? 'bg-[#F59E0B] text-[#064E3B]' : 'bg-slate-100 text-slate-500'}`}>
          {t('Review Draft')}
        </span>
      </div>
      <div className={`text-[11px] font-medium flex items-center ${active ? 'text-emerald-300' : 'text-slate-500'}`}>
        <FileText className="inline ltr:mr-1 rtl:ml-1 w-3 h-3" /> {context}
      </div>
    </li>
  );
}
