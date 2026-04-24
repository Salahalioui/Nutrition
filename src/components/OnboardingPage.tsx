import { useState } from "react";
import { useAuth } from "../lib/AuthContext";
import { doc, updateDoc, addDoc, collection, serverTimestamp, getDoc } from "firebase/firestore";
import { db, AppRole } from "../lib/firebase";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Navigate, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function OnboardingPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [role, setRole] = useState<AppRole>("athlete");
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    age: "",
    weight: "",
    height: "",
    goals: "",
    allergies: "",
    teamInvite: "",
    teamName: ""
  });

  if (!user) return <Navigate to="/login" replace />;
  if (profile?.weight && profile?.height) return <Navigate to="/dashboard" replace />; // Already onboarded roughly

  const handleSave = async () => {
    try {
      setSaving(true);
      const userRef = doc(db, 'users', user.uid);
      
      let finalTeamId = formData.teamInvite || null;

      if (role === 'athlete' && finalTeamId) {
        const teamDoc = await getDoc(doc(db, 'teams', finalTeamId));
        if (!teamDoc.exists()) {
          alert(t('Invalid Team ID. Please check and try again.'));
          setSaving(false);
          return;
        }
      }

      await updateDoc(userRef, {
        role,
        age: parseInt(formData.age) || null,
        weight: parseInt(formData.weight) || null,
        height: parseInt(formData.height) || null,
        goals: formData.goals,
        allergies: formData.allergies,
        teamId: finalTeamId,
      });

      if (role === 'coach' && formData.teamName) {
        const teamRef = await addDoc(collection(db, 'teams'), {
          name: formData.teamName,
          coachId: user.uid,
          createdAt: serverTimestamp()
        });
        finalTeamId = teamRef.id;
        await updateDoc(userRef, { teamId: finalTeamId });
      }

      navigate("/dashboard");
    } catch (e) {
      console.error(e);
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card className="border border-slate-200 shadow-xl overflow-hidden rounded-2xl">
        <div className="h-2 bg-[#064E3B]" />
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-[#064E3B]">{t('Complete your profile')}</CardTitle>
          <CardDescription className="text-slate-500">{t('Tell us about yourself so we can tailor the experience.')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>{t('I am a...')}</Label>
            <Select value={role} onValueChange={(val) => setRole(val as AppRole)}>
              <SelectTrigger>
                <SelectValue placeholder={t('Select role')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="athlete">{t('Athlete / Player')}</SelectItem>
                <SelectItem value="coach">{t('Coach')}</SelectItem>
                <SelectItem value="nutritionist">{t('Nutritionist Staff')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {role === 'athlete' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <Label>{t('Age')}</Label>
                <Input type="number" placeholder="22" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>{t('Weight (kg)')}</Label>
                <Input type="number" placeholder="75" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>{t('Height (cm)')}</Label>
                <Input type="number" placeholder="180" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} />
              </div>
              <div className="space-y-2 md:col-span-3">
                <Label>{t('Primary Goals')}</Label>
                <Input placeholder={t('e.g. Build muscle, increase stamina for 90min matches, trim fat')} value={formData.goals} onChange={e => setFormData({...formData, goals: e.target.value})} />
              </div>
              <div className="space-y-2 md:col-span-3">
                <Label>{t('Allergies / Dietary Restrictions')}</Label>
                <Input placeholder={t('e.g. Lactose intolerant, no nuts')} value={formData.allergies} onChange={e => setFormData({...formData, allergies: e.target.value})} />
              </div>
            </div>
          )}

          <div className="space-y-2 pt-4 border-t">
            {role === 'coach' ? (
              <>
                <Label>{t('Create a New Team')}</Label>
                <Input placeholder={t('e.g. MC Alger Elite')} value={formData.teamName} onChange={e => setFormData({...formData, teamName: e.target.value})} />
                <p className="text-xs text-slate-500 mt-1">{t('You will be able to share the Team ID with your players from the dashboard.')}</p>
              </>
            ) : (
              <>
                <Label>{t('Team Invite Code (Optional)')}</Label>
                <Input placeholder={t('Enter team ID if you have one')} value={formData.teamInvite} onChange={e => setFormData({...formData, teamInvite: e.target.value})} />
                <p className="text-xs text-slate-500 mt-1">{t('Ask your coach or staff for the team invite code.')}</p>
              </>
            )}
          </div>

          <Button 
            className="w-full bg-[#F59E0B] font-bold text-[#064E3B] hover:text-white hover:bg-[#D97706] text-lg py-6 mt-4 shadow-sm rounded-xl transition-all" 
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? t('Saving...') : t('Start Journey')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
