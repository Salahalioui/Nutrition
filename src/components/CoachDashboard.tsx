import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Calendar as CalendarIcon, Users, Flame, Copy, Loader2, Plus } from "lucide-react";
import { useAuth } from "../lib/AuthContext";
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useTranslation } from "react-i18next";

export function CoachDashboard() {
  const { profile } = useAuth();
  const { t } = useTranslation();
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  
  // Form State
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [type, setType] = useState("Match");
  const [intensity, setIntensity] = useState("High");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCopy = () => {
    if (profile?.teamId) {
      navigator.clipboard.writeText(profile.teamId);
      alert(t("Team ID copied to clipboard!"));
    }
  };

  const fetchData = async () => {
    if (!profile?.teamId) return;
    try {
      setLoading(true);
      // Fetch Athletes
      const athletesQuery = query(
        collection(db, "users"),
        where("teamId", "==", profile.teamId),
        where("role", "==", "athlete")
      );
      const athSnap = await getDocs(athletesQuery);
      setTeamMembers(athSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      // Fetch Events
      const eventsQuery = query(
        collection(db, `teams/${profile.teamId}/events`),
        orderBy("date", "asc")
      );
      const evSnap = await getDocs(eventsQuery);
      setEvents(evSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [profile?.teamId]);

  const handleAddSession = async () => {
    if (!profile?.teamId || !date || !time) return;
    
    try {
      setIsSubmitting(true);
      await addDoc(collection(db, `teams/${profile.teamId}/events`), {
        date,
        time,
        type,
        intensity,
        createdAt: serverTimestamp()
      });
      setOpen(false);
      fetchData(); // Refresh
    } catch (error) {
      console.error("Error adding event: ", error);
      alert(t("Failed to add session. Check console."));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group events by day of week for the heat map
  const getIntensityForDay = (dayIndex: number) => {
    // Highly simplified: just finding any event today or mapping statically.
    // In a real app we'd map actual dates to Mon, Tue, etc week view.
    // For now we'll just check if there's an event whose Day of Week matches dayIndex (0 = Sun, 1 = Mon).
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const targetDayName = days[dayIndex];
    
    const eventOnDay = events.find(e => {
      if (!e.date) return false;
      const d = new Date(e.date);
      return days[d.getDay()] === targetDayName;
    });

    if (eventOnDay) return eventOnDay.intensity;
    return "Low";
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-[#064E3B]" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm rtl:text-right">
        <div>
          <h2 className="text-xl font-bold text-slate-900 leading-tight">{t('Team Overview')}</h2>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">{t('Manage macro-cycles and set training loads.')}</p>
        </div>
        <div className="flex gap-3">
          {profile?.teamId && (
            <Button variant="outline" onClick={handleCopy} className="text-slate-500 border-slate-200">
              <span className="font-mono text-xs ltr:mr-2 rtl:ml-2">{profile.teamId}</span>
              <Copy className="h-4 w-4" />
            </Button>
          )}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button className="bg-[#F59E0B] text-[#064E3B] font-bold rounded-lg shadow-sm hover:shadow-md transition-all hover:bg-[#D97706] hover:text-white" />}>
              <CalendarIcon className="ltr:mr-2 rtl:ml-2 h-4 w-4" /> {t('Add Session')}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rtl:text-right">
              <DialogHeader>
                <DialogTitle>{t('Add Training Session')}</DialogTitle>
                <DialogDescription>{t('Create a new event for the team calendar.')}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid gap-2">
                  <Label>{t('Date')}</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>{t('Time')}</Label>
                  <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>{t('Type')}</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="rtl:text-right"><SelectValue placeholder={t('Event Type')} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Match">{t('Match')}</SelectItem>
                      <SelectItem value="Recovery">{t('Recovery')}</SelectItem>
                      <SelectItem value="Strength">{t('Strength')}</SelectItem>
                      <SelectItem value="Cardio">{t('Cardio')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>{t('Intensity')}</Label>
                  <Select value={intensity} onValueChange={setIntensity}>
                    <SelectTrigger className="rtl:text-right"><SelectValue placeholder={t('Intensity Level')} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">{t('Low')}</SelectItem>
                      <SelectItem value="Medium">{t('Medium')}</SelectItem>
                      <SelectItem value="High">{t('High')}</SelectItem>
                      <SelectItem value="Match">{t('Match (Maximum)')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddSession} disabled={isSubmitting} className="bg-[#064E3B] text-white">
                  {isSubmitting ? t("Adding...") : t("Save Session")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 rtl:text-right">
        <Card className="lg:col-span-2 rounded-2xl shadow-sm border border-slate-200">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-sm font-bold uppercase text-slate-500 tracking-wider text-center">{t("This Week's Intensity Load")}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-7 gap-2">
              <DayCol day={t("Mon")} intensity={getIntensityForDay(1)} />
              <DayCol day={t("Tue")} intensity={getIntensityForDay(2)} />
              <DayCol day={t("Wed")} intensity={getIntensityForDay(3)} />
              <DayCol day={t("Thu")} intensity={getIntensityForDay(4)} />
              <DayCol day={t("Fri")} intensity={getIntensityForDay(5)} />
              <DayCol day={t("Sat")} intensity={getIntensityForDay(6)} />
              <DayCol day={t("Sun")} intensity={getIntensityForDay(0)} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 shrink-0">
            <CardTitle className="flex justify-between items-center text-sm font-bold uppercase text-slate-500 tracking-wider">
              {t('Team Roster')} <Badge variant="secondary" className="bg-slate-200 text-slate-700">{teamMembers.length} {t('Active')}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-y-auto min-h-[300px]">
            {teamMembers.length === 0 ? (
              <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center h-full">
                <Users className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-sm font-medium">{t('No athletes have joined yet.')}</p>
                <p className="text-xs mt-1">{t('Share your Team ID with them.')}</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {teamMembers.map((member) => (
                  <PlayerRow key={member.id} name={member.displayName || member.email} status={t("Ready")} />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DayCol({ day, intensity, active = false }: any) {
  let color = "bg-slate-100 text-slate-500";
  let h = "h-16";
  if (intensity === "Low" || intensity === "Recovery") {
    color = "bg-emerald-100 text-emerald-700 border border-emerald-200"; h = "h-24";
  } else if (intensity === "Medium") {
    color = "bg-amber-100 text-amber-700 border border-amber-200"; h = "h-32";
  } else if (intensity === "High") {
    color = "bg-red-100 text-red-700 border border-red-200"; h = "h-48";
  } else if (intensity === "Match") {
    color = "bg-[#064E3B] text-white border border-[#064E3B]"; h = "h-56";
  }

  return (
    <div className={`flex flex-col items-center justify-end h-64 rounded-xl p-2 ${active ? 'bg-slate-50 ring-1 ring-slate-200' : ''}`}>
      <div className={`w-full ${h} ${color} rounded-lg flex items-center justify-center transition-all`}>
        {intensity === "Match" && <Flame className="h-5 w-5" />}
      </div>
      <p className={`mt-3 text-[10px] font-bold ${active ? 'text-[#064E3B]' : 'text-slate-500'}`}>{day}</p>
      <p className="text-[9px] text-slate-400 max-w-full truncate px-1 uppercase tracking-widest">{intensity}</p>
    </div>
  );
}

function PlayerRow({ name, status, alert = false }: any) {
  return (
    <li className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer group rtl:text-right">
      <div className="flex items-center space-x-3 gap-2">
        <div className="h-8 w-8 bg-slate-200 rounded-full flex items-center justify-center text-xs font-bold text-slate-600">
          {name.charAt(0).toUpperCase()}
        </div>
        <span className="font-medium text-slate-700 group-hover:text-black">{name}</span>
      </div>
      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${alert ? 'bg-amber-100 text-amber-800' : 'text-slate-500 bg-slate-100'}`}>
        {status}
      </span>
    </li>
  );
}
