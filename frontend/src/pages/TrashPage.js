import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Trash2, RotateCcw, AlertTriangle, Briefcase, Building2, Users, CheckSquare, BookOpen, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const TrashPage = () => {
  const [trash, setTrash] = useState({
    jobs: [],
    companies: [],
    contacts: [],
    todos: [],
    knowledge: [],
    reminders: []
  });
  const [loading, setLoading] = useState(true);

  const fetchTrash = async () => {
    try {
      const response = await api.get('/trash');
      setTrash(response.data);
    } catch (error) {
      toast.error('Failed to load trash');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrash();
  }, []);

  const handleRestore = async (type, id, name) => {
    try {
      await api.post(`/trash/restore/${type}/${id}`);
      toast.success(`${name} restored successfully`);
      fetchTrash();
    } catch (error) {
      toast.error('Failed to restore item');
    }
  };

  const handlePermanentDelete = async (type, id, name) => {
    if (!window.confirm(`Permanently delete "${name}"? This cannot be undone.`)) return;
    
    try {
      await api.delete(`/trash/${type}/${id}`);
      toast.success(`${name} permanently deleted`);
      fetchTrash();
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  const handleEmptyTrash = async () => {
    if (!window.confirm('Empty all trash? This cannot be undone.')) return;
    
    try {
      const response = await api.delete('/trash/empty');
      toast.success(response.data.message);
      fetchTrash();
    } catch (error) {
      toast.error('Failed to empty trash');
    }
  };

  const getTotalItems = () => {
    return Object.values(trash).reduce((acc, arr) => acc + arr.length, 0);
  };

  const getIcon = (type) => {
    const icons = {
      job: Briefcase,
      company: Building2,
      contact: Users,
      todo: CheckSquare,
      knowledge: BookOpen,
      reminder: Bell
    };
    return icons[type] || Trash2;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Unknown';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderTrashSection = (items, type, title) => {
    if (items.length === 0) return null;
    
    const Icon = getIcon(type);
    
    return (
      <Card key={type} className="border-slate-200 rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-heading flex items-center gap-2">
            <Icon className="w-5 h-5 text-slate-500" />
            {title} ({items.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
            >
              <div className="flex-1">
                <div className="font-medium text-slate-900">
                  {item.title || item.name || item.message}
                </div>
                {item.company && (
                  <div className="text-sm text-slate-500">{item.company}</div>
                )}
                <div className="text-xs text-slate-400">
                  Deleted: {formatDate(item.deleted_at)}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRestore(type, item.id, item.title || item.name || item.message)}
                  className="rounded-lg"
                  data-testid={`restore-${type}-${item.id}`}
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Restore
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePermanentDelete(type, item.id, item.title || item.name || item.message)}
                  className="rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                  data-testid={`delete-${type}-${item.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <div className="text-slate-500">Loading trash...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold font-heading tracking-tight">Trash</h1>
                <p className="text-slate-600 text-lg">
                  {getTotalItems()} deleted items • Restore or permanently delete
                </p>
              </div>
            </div>
            {getTotalItems() > 0 && (
              <Button
                onClick={handleEmptyTrash}
                variant="outline"
                className="rounded-full border-rose-200 text-rose-600 hover:bg-rose-50"
                data-testid="empty-trash-btn"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Empty Trash
              </Button>
            )}
          </div>
        </motion.div>

        {getTotalItems() === 0 ? (
          <Card className="border-slate-200 rounded-2xl">
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-700 mb-2">Trash is Empty</h3>
              <p className="text-slate-500">Deleted items will appear here</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <div className="font-medium text-amber-800">Items in trash</div>
                <div className="text-sm text-amber-700">
                  Restore items to recover them, or permanently delete to free up space.
                  Items in trash do not appear in your regular views.
                </div>
              </div>
            </div>
            
            {renderTrashSection(trash.jobs, 'job', 'Jobs')}
            {renderTrashSection(trash.companies, 'company', 'Companies')}
            {renderTrashSection(trash.contacts, 'contact', 'Contacts')}
            {renderTrashSection(trash.todos, 'todo', 'To-Dos')}
            {renderTrashSection(trash.knowledge, 'knowledge', 'Knowledge Articles')}
            {renderTrashSection(trash.reminders, 'reminder', 'Reminders')}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrashPage;
