import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Card, CardContent } from '../components/ui/card';
import { Globe, Plus, Trash2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const JobPortalsPage = () => {
  const [portals, setPortals] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', url: '', username: '', notes: '' });

  useEffect(() => {
    fetchPortals();
  }, []);

  const fetchPortals = async () => {
    try {
      const response = await api.get('/portals');
      setPortals(response.data);
    } catch (error) {
      toast.error('Failed to fetch portals');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/portals', formData);
      toast.success('Portal added!');
      setFormData({ name: '', url: '', username: '', notes: '' });
      setIsModalOpen(false);
      fetchPortals();
    } catch (error) {
      toast.error('Failed to add portal');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this portal?')) return;
    try {
      await api.delete(`/portals/${id}`);
      toast.success('Deleted');
      fetchPortals();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold font-heading mb-2">Job Portals</h1>
            <p className="text-slate-600 text-lg">Track job portals and credentials</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="h-12 px-6 rounded-full bg-gradient-to-r from-sky-500 to-blue-500">
            <Plus className="w-5 h-5 mr-2" />
            Add Portal
          </Button>
        </div>

        {portals.length === 0 ? (
          <div className="bg-white rounded-3xl border p-12 text-center">
            <Globe className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No portals yet</h3>
            <p className="text-slate-600 mb-6">Track LinkedIn, Indeed, and other job portals</p>
            <Button onClick={() => setIsModalOpen(true)} className="h-12 px-8 rounded-full bg-gradient-to-r from-sky-500 to-blue-500">
              <Plus className="w-5 h-5 mr-2" />
              Add Your First Portal
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portals.map((portal, idx) => (
              <motion.div key={portal.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                <Card className="hover:shadow-lg transition-all border-slate-200 rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-500 to-blue-500 flex items-center justify-center">
                        <Globe className="w-5 h-5 text-white" />
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(portal.id)} className="rounded-full text-rose-600">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{portal.name}</h3>
                    {portal.username && <p className="text-sm text-slate-600 mb-2">Username: {portal.username}</p>}
                    {portal.notes && <p className="text-sm text-slate-600 mb-3">{portal.notes}</p>}
                    <Button variant="outline" size="sm" asChild className="w-full rounded-full">
                      <a href={portal.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Visit Portal
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Add Job Portal</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Portal Name *</Label>
              <Input id="name" placeholder="LinkedIn, Indeed, etc." value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="h-12 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">URL *</Label>
              <Input id="url" type="url" placeholder="https://..." value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} required className="h-12 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username/Email</Label>
              <Input id="username" placeholder="your@email.com" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} className="h-12 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" placeholder="Any notes..." value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} className="rounded-xl" />
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1 h-12 rounded-full">Cancel</Button>
              <Button type="submit" className="flex-1 h-12 rounded-full bg-gradient-to-r from-sky-500 to-blue-500">Add Portal</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JobPortalsPage;
