import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Card, CardContent } from '../components/ui/card';
import { Target as TargetIcon, Plus, Trash2, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '../components/ui/progress';

const TargetsPage = () => {
  const [targets, setTargets] = useState([]);
  const [systems, setSystems] = useState([]);
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [isSystemModalOpen, setIsSystemModalOpen] = useState(false);
  const [targetForm, setTargetForm] = useState({ title: '', target_type: 'applications', goal_value: 10, period: 'weekly' });
  const [systemForm, setSystemForm] = useState({ name: '', description: '', frequency: 'weekly', tasks: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [targetsRes, systemsRes] = await Promise.all([api.get('/targets'), api.get('/systems')]);
      setTargets(targetsRes.data);
      setSystems(systemsRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    }
  };

  const handleCreateTarget = async (e) => {
    e.preventDefault();
    try {
      await api.post('/targets', { ...targetForm, goal_value: parseInt(targetForm.goal_value) });
      toast.success('Target created!');
      setTargetForm({ title: '', target_type: 'applications', goal_value: 10, period: 'weekly' });
      setIsTargetModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to create target');
    }
  };

  const handleCreateSystem = async (e) => {
    e.preventDefault();
    try {
      const tasks = systemForm.tasks.split('\n').filter(Boolean);
      await api.post('/systems', { ...systemForm, tasks });
      toast.success('System created!');
      setSystemForm({ name: '', description: '', frequency: 'weekly', tasks: '' });
      setIsSystemModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to create system');
    }
  };

  const handleExecuteSystem = async (id) => {
    try {
      await api.put(`/systems/${id}/execute`);
      toast.success('System executed!');
      fetchData();
    } catch (error) {
      toast.error('Failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold font-heading mb-8">Targets & Systems</h1>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Targets</h2>
            <Button onClick={() => setIsTargetModalOpen(true)} className="rounded-full bg-gradient-to-r from-green-500 to-emerald-500">
              <Plus className="w-4 h-4 mr-2" />
              Add Target
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {targets.map((target) => {
              const progress = (target.current_value / target.goal_value) * 100;
              return (
                <Card key={target.id} className="border-slate-200 rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{target.title}</h3>
                        <p className="text-sm text-slate-600">{target.period}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={async () => {
                        await api.delete(`/targets/${target.id}`);
                        fetchData();
                      }}>
                        <Trash2 className="w-4 h-4 text-rose-600" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span className="font-semibold">{target.current_value} / {target.goal_value}</span>
                      </div>
                      <Progress value={progress} className="h-3" />
                      <p className="text-xs text-slate-500">{progress.toFixed(0)}% complete</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Systems</h2>
            <Button onClick={() => setIsSystemModalOpen(true)} className="rounded-full bg-gradient-to-r from-blue-500 to-cyan-500">
              <Plus className="w-4 h-4 mr-2" />
              Add System
            </Button>
          </div>

          <div className="grid gap-4">
            {systems.map((system) => (
              <Card key={system.id} className="border-slate-200 rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{system.name}</h3>
                      <p className="text-sm text-slate-600 mb-3">{system.description}</p>
                      <p className="text-xs text-slate-500 mb-2">Frequency: {system.frequency}</p>
                      <ul className="text-sm space-y-1">
                        {system.tasks.map((task, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-orange-500">•</span>
                            <span>{task}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleExecuteSystem(system.id)} className="rounded-full">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        Execute
                      </Button>
                      <Button variant="ghost" size="sm" onClick={async () => {
                        await api.delete(`/systems/${system.id}`);
                        fetchData();
                      }}>
                        <Trash2 className="w-4 h-4 text-rose-600" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={isTargetModalOpen} onOpenChange={setIsTargetModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Target</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateTarget} className="space-y-4">
            <div><Label>Title</Label><Input value={targetForm.title} onChange={(e) => setTargetForm({...targetForm, title: e.target.value})} required className="h-12 rounded-xl" /></div>
            <div><Label>Type</Label>
              <Select value={targetForm.target_type} onValueChange={(v) => setTargetForm({...targetForm, target_type: v})}>
                <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="applications">Applications</SelectItem>
                  <SelectItem value="interviews">Interviews</SelectItem>
                  <SelectItem value="networking">Networking</SelectItem>
                  <SelectItem value="offers">Offers</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Goal</Label><Input type="number" value={targetForm.goal_value} onChange={(e) => setTargetForm({...targetForm, goal_value: e.target.value})} required className="h-12 rounded-xl" /></div>
            <div><Label>Period</Label>
              <Select value={targetForm.period} onValueChange={(v) => setTargetForm({...targetForm, period: v})}>
                <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full h-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-500">Create Target</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isSystemModalOpen} onOpenChange={setIsSystemModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create System</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateSystem} className="space-y-4">
            <div><Label>Name</Label><Input value={systemForm.name} onChange={(e) => setSystemForm({...systemForm, name: e.target.value})} required className="h-12 rounded-xl" /></div>
            <div><Label>Description</Label><Input value={systemForm.description} onChange={(e) => setSystemForm({...systemForm, description: e.target.value})} className="h-12 rounded-xl" /></div>
            <div><Label>Frequency</Label>
              <Select value={systemForm.frequency} onValueChange={(v) => setSystemForm({...systemForm, frequency: v})}>
                <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Tasks (one per line)</Label><textarea value={systemForm.tasks} onChange={(e) => setSystemForm({...systemForm, tasks: e.target.value})} rows={5} className="w-full p-3 border rounded-xl" /></div>
            <Button type="submit" className="w-full h-12 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500">Create System</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TargetsPage;
