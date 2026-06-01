import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";

interface OutcomeSurveyForm {
  initial_apo_score: string;
  initial_salary: string;
  goal_occupation: string;
  completed_learning_hours: string;
  skills_acquired: string;
  transitioned: boolean;
  new_salary: string;
  transition_months: string;
  satisfaction_score: string;
  transition_options_presented: string;
  selected_transition_option: string;
  artifact_reviewed: boolean;
  consent_to_research: boolean;
  consent_to_contact: boolean;
  does_not_prove_acknowledged: boolean;
}

type OutcomeSurveyField = keyof OutcomeSurveyForm;

interface OutcomeSurveyPayload {
  initial_apo_score?: number;
  initial_salary?: number;
  goal_occupation?: string;
  completed_learning_hours?: number;
  skills_acquired?: string[];
  transitioned?: boolean;
  new_salary?: number;
  transition_months?: number;
  satisfaction_score?: number;
  options_presented?: string[];
  selected_transition_option?: string;
  artifact_reviewed?: boolean;
  consent_to_research?: boolean;
  consent_to_contact?: boolean;
  does_not_prove_acknowledged?: boolean;
}

const emptyOutcomeSurveyForm: OutcomeSurveyForm = {
  initial_apo_score: '',
  initial_salary: '',
  goal_occupation: '',
  completed_learning_hours: '',
  skills_acquired: '',
  transitioned: false,
  new_salary: '',
  transition_months: '',
  satisfaction_score: '',
  transition_options_presented: '',
  selected_transition_option: '',
  artifact_reviewed: false,
  consent_to_research: false,
  consent_to_contact: false,
  does_not_prove_acknowledged: false,
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Failed to submit outcomes';
}

export function OutcomeSurvey() {
  const { user } = useSession();
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [form, setForm] = React.useState<OutcomeSurveyForm>(emptyOutcomeSurveyForm);

  const onChange = <K extends OutcomeSurveyField>(k: K, v: OutcomeSurveyForm[K]) => {
    setForm(prev => ({ ...prev, [k]: v }));
  };

  const onSubmit = async () => {
    setLoading(true);
    setMessage(null);
    setFieldErrors({});
    try {
      if (!user) { setMessage('Sign in to submit outcomes.'); setLoading(false); return; }

      // Client-side validation
      const errs: Record<string, string> = {};
      const num = (v: string) => (v === '' ? undefined : Number(v));
      const val_initial_apo = num(form.initial_apo_score);
      const val_initial_salary = num(form.initial_salary);
      const val_hours = num(form.completed_learning_hours);
      const val_new_salary = num(form.new_salary);
      const val_months = num(form.transition_months);
      const val_satisfaction = num(form.satisfaction_score);

      const anyProvided = [
        val_initial_apo, val_initial_salary, form.goal_occupation.trim(), val_hours, form.skills_acquired.trim(),
        form.transitioned, val_new_salary, val_months, val_satisfaction, form.transition_options_presented.trim(),
        form.selected_transition_option.trim(), form.artifact_reviewed, form.consent_to_research, form.consent_to_contact,
      ].some((v) => v !== undefined && v !== '' && v !== false);
      if (!anyProvided) {
        errs['form'] = 'Please provide at least one field (e.g., goal occupation, hours, satisfaction).';
      }
      if (val_initial_apo !== undefined && (val_initial_apo < 0 || val_initial_apo > 100)) {
        errs['initial_apo_score'] = 'APO must be between 0 and 100.';
      }
      if (val_satisfaction !== undefined && (val_satisfaction < 1 || val_satisfaction > 10)) {
        errs['satisfaction_score'] = 'Satisfaction must be between 1 and 10.';
      }
      const nonNegChecks: Array<[number | undefined, string]> = [
        [val_initial_salary, 'initial_salary'],
        [val_hours, 'completed_learning_hours'],
        [val_new_salary, 'new_salary'],
        [val_months, 'transition_months'],
      ];
      for (const [v, key] of nonNegChecks) {
        if (v !== undefined && v < 0) errs[key] = 'Must be a non-negative number.';
      }
      if (form.transitioned) {
        if (val_new_salary === undefined) errs['new_salary'] = 'Required when transitioned is checked.';
        if (val_months === undefined) errs['transition_months'] = 'Required when transitioned is checked.';
      }
      if ((form.consent_to_research || form.selected_transition_option || form.transition_options_presented) && !form.does_not_prove_acknowledged) {
        errs['does_not_prove_acknowledged'] = 'Required for transition telemetry.';
      }
      if (Object.keys(errs).length > 0) {
        setFieldErrors(errs);
        setMessage('Please correct the highlighted fields.');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string,string> = {};
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
      const payload: OutcomeSurveyPayload = {
        initial_apo_score: form.initial_apo_score ? Number(form.initial_apo_score) : undefined,
        initial_salary: form.initial_salary ? Number(form.initial_salary) : undefined,
        goal_occupation: form.goal_occupation || undefined,
        completed_learning_hours: form.completed_learning_hours ? Number(form.completed_learning_hours) : undefined,
        skills_acquired: form.skills_acquired ? form.skills_acquired.split(',').map(s=>s.trim()).filter(Boolean) : undefined,
        transitioned: form.transitioned || undefined,
        new_salary: form.new_salary ? Number(form.new_salary) : undefined,
        transition_months: form.transition_months ? Number(form.transition_months) : undefined,
        satisfaction_score: form.satisfaction_score ? Number(form.satisfaction_score) : undefined,
        options_presented: form.transition_options_presented ? form.transition_options_presented.split(',').map(s=>s.trim()).filter(Boolean) : undefined,
        selected_transition_option: form.selected_transition_option || undefined,
        artifact_reviewed: form.artifact_reviewed || undefined,
        consent_to_research: form.consent_to_research,
        consent_to_contact: form.consent_to_contact,
        does_not_prove_acknowledged: form.does_not_prove_acknowledged,
      };
      const { data, error } = await supabase.functions.invoke('record-outcome', { body: payload, headers });
      if (error) throw error;
      setMessage('Outcome recorded. Thank you!');
      // notify list to refresh
      try { window.dispatchEvent(new CustomEvent('outcome:created')); } catch {
        // Event dispatch is best-effort for embedded or restricted browser contexts.
      }
      setForm({ ...emptyOutcomeSurveyForm });
    } catch (e: unknown) {
      // Prefer server error message body when available
      setMessage(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4">
      <div className="text-sm font-semibold mb-2">Outcome Survey (pilot)</div>
      {!user ? (
        <div className="text-xs text-[var(--text-secondary)]">Sign in to record outcomes.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
          <div>
            <Input placeholder="Initial APO (0-100)" value={form.initial_apo_score} onChange={e=>onChange('initial_apo_score', e.target.value.replace(/[^0-9.]/g,''))} />
            {fieldErrors.initial_apo_score && <div className="text-[10px] text-red-600 mt-1">{fieldErrors.initial_apo_score}</div>}
          </div>
          <div>
            <Input placeholder="Initial salary ($)" value={form.initial_salary} onChange={e=>onChange('initial_salary', e.target.value.replace(/[^0-9.]/g,''))} />
            {fieldErrors.initial_salary && <div className="text-[10px] text-red-600 mt-1">{fieldErrors.initial_salary}</div>}
          </div>
          <div>
            <Input placeholder="Goal occupation" value={form.goal_occupation} onChange={e=>onChange('goal_occupation', e.target.value)} />
            {fieldErrors.goal_occupation && <div className="text-[10px] text-red-600 mt-1">{fieldErrors.goal_occupation}</div>}
          </div>
          <div>
            <Input placeholder="Completed learning hours" value={form.completed_learning_hours} onChange={e=>onChange('completed_learning_hours', e.target.value.replace(/[^0-9.]/g,''))} />
            {fieldErrors.completed_learning_hours && <div className="text-[10px] text-red-600 mt-1">{fieldErrors.completed_learning_hours}</div>}
          </div>
          <Input placeholder="Skills acquired (comma-separated)" value={form.skills_acquired} onChange={e=>onChange('skills_acquired', e.target.value)} />
          <div className="flex items-center gap-2">
            <input id="transitioned" type="checkbox" checked={form.transitioned} onChange={e=>onChange('transitioned', e.target.checked)} />
            <label htmlFor="transitioned" className="text-xs text-[var(--text-secondary)]">Transitioned to new role</label>
          </div>
          <div>
            <Input placeholder="New salary ($)" value={form.new_salary} onChange={e=>onChange('new_salary', e.target.value.replace(/[^0-9.]/g,''))} />
            {fieldErrors.new_salary && <div className="text-[10px] text-red-600 mt-1">{fieldErrors.new_salary}</div>}
          </div>
          <div>
            <Input placeholder="Transition months" value={form.transition_months} onChange={e=>onChange('transition_months', e.target.value.replace(/[^0-9.]/g,''))} />
            {fieldErrors.transition_months && <div className="text-[10px] text-red-600 mt-1">{fieldErrors.transition_months}</div>}
          </div>
          <div>
            <Input placeholder="Satisfaction (1-10)" value={form.satisfaction_score} onChange={e=>onChange('satisfaction_score', e.target.value.replace(/[^0-9.]/g,''))} />
            {fieldErrors.satisfaction_score && <div className="text-[10px] text-red-600 mt-1">{fieldErrors.satisfaction_score}</div>}
          </div>
          <div className="md:col-span-2">
            <Input placeholder="Transition options presented (comma-separated)" value={form.transition_options_presented} onChange={e=>onChange('transition_options_presented', e.target.value)} />
          </div>
          <div>
            <Input placeholder="Selected transition option" value={form.selected_transition_option} onChange={e=>onChange('selected_transition_option', e.target.value)} />
          </div>
          <div className="md:col-span-3 grid gap-2 rounded-md border border-border p-3 text-xs text-[var(--text-secondary)]">
            <label className="flex items-start gap-2">
              <input type="checkbox" checked={form.artifact_reviewed} onChange={e=>onChange('artifact_reviewed', e.target.checked)} />
              <span>A coach, advisor, or reviewer inspected the artifact before action.</span>
            </label>
            <label className="flex items-start gap-2">
              <input type="checkbox" checked={form.consent_to_research} onChange={e=>onChange('consent_to_research', e.target.checked)} />
              <span>I consent to aggregate, redacted use of this transition telemetry for product calibration and planning research.</span>
            </label>
            <label className="flex items-start gap-2">
              <input type="checkbox" checked={form.consent_to_contact} onChange={e=>onChange('consent_to_contact', e.target.checked)} />
              <span>I consent to follow-up contact about this outcome record.</span>
            </label>
            <label className="flex items-start gap-2">
              <input type="checkbox" checked={form.does_not_prove_acknowledged} onChange={e=>onChange('does_not_prove_acknowledged', e.target.checked)} />
              <span>I understand this record does not prove placement, wage gain, retention, or causal product impact by itself.</span>
            </label>
            {fieldErrors.does_not_prove_acknowledged && <div className="text-[10px] text-red-600">{fieldErrors.does_not_prove_acknowledged}</div>}
          </div>
          <div className="md:col-span-3 flex items-center gap-2 mt-1">
            <Button size="sm" onClick={onSubmit} disabled={loading}>{loading ? 'Submitting...' : 'Submit Outcome'}</Button>
            {message && <div className="text-xs text-[var(--text-secondary)]">{message}</div>}
            {fieldErrors.form && <div className="text-xs text-red-600">{fieldErrors.form}</div>}
          </div>
        </div>
      )}
    </Card>
  );
}
