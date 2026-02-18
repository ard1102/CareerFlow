import React, { useState, useEffect } from 'react';
import { promptsApi } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Card, CardContent } from '../components/ui/card';
import { FileText, Plus, Trash2, Copy } from 'lucide-react';
import { toast } from 'sonner';

const PromptsPage = () => {
  const [prompts, setPrompts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '', category: 'general' });

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    try {
      const response = await promptsApi.getAll();
      setPrompts(response.data);
    } catch (error) {
      toast.error('Failed to fetch prompts');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await promptsApi.create(formData);
      toast.success('Prompt saved!');
      setFormData({ title: '', content: '', category: 'general' });
      setIsModalOpen(false);
      fetchPrompts();
    } catch (error) {
      toast.error('Failed to save prompt');
    }
  };

  const handleCopy = (content) => {
    navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard!');
  };

  const handleDelete = async (id) => {
    try {
      await promptsApi.delete(id);
      toast.success('Deleted');
      fetchPrompts();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold font-heading mb-2 tracking-tight">Prompt Library</h1>
            <p className="text-slate-600 text-lg">Save and reuse your AI prompts</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="h-12 px-6 rounded-full bg-gradient-to-r from-amber-500 to-orange-500">
            <Plus className="w-5 h-5 mr-2" />
            Add Prompt
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {prompts.map((prompt) => (
            <Card key={prompt.id} className="hover:shadow-lg transition-all hover:-translate-y-1 border border-slate-200 rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleCopy(prompt.content)} className="rounded-full">
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(prompt.id)} className="rounded-full text-rose-600 hover:bg-rose-50">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <h3 className="text-lg font-semibold font-heading mb-2">{prompt.title}</h3>
                <p className="text-sm text-slate-600 mb-3 line-clamp-3">{prompt.content}</p>
                <span className="px-3 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">{prompt.category}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold font-heading">Add Prompt</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" placeholder="Prompt title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required className="h-12 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Prompt Content *</Label>
              <Textarea id="content" placeholder="Your prompt..." value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} required rows={8} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input id="category" placeholder="e.g., resume, cover letter, linkedin" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="h-12 rounded-xl" />
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1 h-12 rounded-full">Cancel</Button>
              <Button type="submit" className="flex-1 h-12 rounded-full bg-gradient-to-r from-amber-500 to-orange-500">Save Prompt</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PromptsPage;
