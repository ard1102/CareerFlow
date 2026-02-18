import React, { useState, useEffect } from 'react';
import { knowledgeApi } from '../lib/api';
import api from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Card, CardContent } from '../components/ui/card';
import { BookOpen, Plus, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const KnowledgePage = () => {
  const [knowledge, setKnowledge] = useState([]);
  const [filteredKnowledge, setFilteredKnowledge] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: ''
  });

  useEffect(() => {
    fetchKnowledge();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      handleSemanticSearch();
    } else {
      setFilteredKnowledge(knowledge);
    }
  }, [searchQuery, knowledge]);

  const fetchKnowledge = async () => {
    try {
      const response = await knowledgeApi.getAll();
      setKnowledge(response.data);
      setFilteredKnowledge(response.data);
    } catch (error) {
      toast.error('Failed to fetch knowledge');
    } finally {
      setLoading(false);
    }
  };

  const handleSemanticSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      const response = await api.post('/ai/knowledge-search', { query: searchQuery });
      setFilteredKnowledge(response.data);
    } catch (error) {
      // Fallback to simple text search
      const filtered = knowledge.filter(k => 
        k.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        k.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredKnowledge(filtered);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const tags = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
      await knowledgeApi.create({ ...formData, tags });
      toast.success('Knowledge added!');
      setFormData({ title: '', content: '', tags: '' });
      setIsModalOpen(false);
      fetchKnowledge();
    } catch (error) {
      toast.error('Failed to add knowledge');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this entry?')) return;
    try {
      await knowledgeApi.delete(id);
      toast.success('Deleted');
      fetchKnowledge();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold font-heading mb-2 tracking-tight">Knowledge Base</h1>
              <p className="text-slate-600 text-lg">Store articles, notes, and learnings</p>
            </div>
            <Button
              data-testid="add-knowledge-button"
              onClick={() => setIsModalOpen(true)}
              className="h-12 px-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold shadow-lg shadow-purple-500/30"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Knowledge
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search knowledge base (semantic search enabled)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-14 pl-12 rounded-xl text-lg"
            />
          </div>
        </div>

        {filteredKnowledge.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
            <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">{searchQuery ? 'No results found' : 'No knowledge yet'}</h3>
            <p className="text-slate-600 mb-6">{searchQuery ? 'Try a different search' : 'Start building your knowledge base'}</p>
            {!searchQuery && (
              <Button onClick={() => setIsModalOpen(true)} className="h-12 px-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
                <Plus className="w-5 h-5 mr-2" />
                Add Your First Note
              </Button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredKnowledge.map((item, index) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-slate-200 rounded-2xl h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-white" />
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(item.id)} className="rounded-full text-rose-600 hover:bg-rose-50">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <h3 className="text-lg font-semibold font-heading mb-2">{item.title}</h3>
                    <p className="text-sm text-slate-600 mb-3 line-clamp-4">{item.content}</p>
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {item.tags.map((tag, idx) => (
                          <span key={idx} className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {item.similarity_score && (
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <span className="text-xs text-slate-500">Relevance: {(item.similarity_score * 100).toFixed(0)}%</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold font-heading">Add Knowledge</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" placeholder="Article title or topic" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required className="h-12 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content *</Label>
              <Textarea id="content" placeholder="Your notes, learnings, or article content..." value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} required rows={8} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input id="tags" placeholder="react, interview, system design" value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} className="h-12 rounded-xl" />
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1 h-12 rounded-full">Cancel</Button>
              <Button type="submit" className="flex-1 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500">Add Knowledge</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KnowledgePage;
