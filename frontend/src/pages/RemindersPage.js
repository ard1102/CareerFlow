import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Card, CardContent } from '../components/ui/card';
import { Bell, Plus, CheckCircle2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '../lib/utils';

const RemindersPage = () => {
  const [reminders, setReminders] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ message: '', reminder_date: '', job_id: '', reminder_type: 'follow_up' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [remindersRes, jobsRes] = await Promise.all([api.get('/reminders'), api.get('/jobs')]);
      setReminders(remindersRes.data);
      setJobs(jobsRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/reminders', { ...formData, reminder_date: new Date(formData.reminder_date).toISOString(), job_id: formData.job_id || null });
      toast.success('Reminder created!');
      setFormData({ message: '', reminder_date: '', job_id: '', reminder_type: 'follow_up' });
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to create reminder');
    }
  };

  const handleComplete = async (id) => {
    try {
      await api.put(`/reminders/${id}/complete`);
      toast.success('Completed!');
      fetchData();
    } catch (error) {
      toast.error('Failed');
    }
  };

  const getJobTitle = (jobId) => {
    const job = jobs.find(j => j.id === jobId);
    return job ? `${job.title} at ${job.company}` : 'General';
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold font-heading mb-2">Reminders</h1>
            <p className="text-slate-600">Never miss a follow-up</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500">
            <Plus className="w-4 h-4 mr-2" />
            Add Reminder
          </Button>
        </div>

        <div className="space-y-4">
          {reminders.filter(r => !r.completed).map((reminder) => (
            <Card key={reminder.id} className="border-slate-200 rounded-2xl hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Bell className="w-5 h-5 text-amber-600" />
                      <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full font-medium">{reminder.reminder_type}</span>
                      <span className="text-sm text-slate-600">{formatDate(reminder.reminder_date)}</span>
                    </div>
                    <p className="text-lg font-semibold mb-1">{reminder.message}</p>
                    {reminder.job_id && <p className="text-sm text-slate-600">Related to: {getJobTitle(reminder.job_id)}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleComplete(reminder.id)} className="rounded-full">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={async () => { await api.delete(`/reminders/${reminder.id}`); fetchData(); }}>
                      <Trash2 className="w-4 h-4 text-rose-600" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {reminders.filter(r => r.completed).length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Completed</h2>
            <div className="space-y-2">
              {reminders.filter(r => r.completed).map((reminder) => (
                <Card key={reminder.id} className="border-slate-200 rounded-xl opacity-60">
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <p className="text-sm line-through">{reminder.message}</p>
                      <p className="text-xs text-slate-500">{formatDate(reminder.reminder_date)}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={async () => { await api.delete(`/reminders/${reminder.id}`); fetchData(); }}>
                      <Trash2 className="w-4 h-4 text-rose-600" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Reminder</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Message</Label><Input value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} required className="h-12 rounded-xl" placeholder="Follow up on application" /></div>
            <div><Label>Date & Time</Label><Input type="datetime-local" value={formData.reminder_date} onChange={(e) => setFormData({...formData, reminder_date: e.target.value})} required className="h-12 rounded-xl" /></div>
            <div><Label>Related Job (Optional)</Label>
              <select value={formData.job_id} onChange={(e) => setFormData({...formData, job_id: e.target.value})} className="w-full h-12 rounded-xl border px-3">
                <option value="">None</option>
                {jobs.map(j => <option key={j.id} value={j.id}>{j.title} at {j.company}</option>)}
              </select>
            </div>
            <Button type="submit" className="w-full h-12 rounded-full bg-gradient-to-r from-amber-500 to-orange-500">Create Reminder</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RemindersPage;
