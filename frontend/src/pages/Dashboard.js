import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { jobsApi, analyticsApi } from '../lib/api';
import { Button } from '../components/ui/button';
import { Plus, Briefcase, CheckCircle2, Clock, XCircle, Ghost, Gift } from 'lucide-react';
import { getStatusColor, formatDate } from '../lib/utils';
import AddJobModal from '../components/AddJobModal';
import JobCard from '../components/JobCard';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [jobsRes, statsRes] = await Promise.all([
        jobsApi.getAll(),
        analyticsApi.getDashboard(),
      ]);
      setJobs(jobsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleJobAdded = () => {
    fetchData();
    setIsModalOpen(false);
  };

  const handleJobDeleted = async (jobId) => {
    try {
      await jobsApi.delete(jobId);
      toast.success('Job deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete job');
    }
  };

  const handleJobUpdated = async (jobId, updates) => {
    try {
      await jobsApi.update(jobId, updates);
      toast.success('Job updated successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to update job');
    }
  };

  const handleGetInterviewPrep = async (jobId) => {
    try {
      const response = await api.post('/ai/interview-prep', { job_id: jobId });
      const questions = response.data.questions.slice(0, 5).map(q => q.question || q).join('\n\n');
      alert(`Interview Prep for ${response.data.job_title}:\n\n${questions}\n\nSkills to prepare: ${response.data.skills_to_prepare.join(', ')}`);
    } catch (error) {
      toast.error('Failed to get interview prep');
    }
  };

  const statusCards = [
    { label: 'Pending', count: stats.pending || 0, icon: Clock, color: 'from-slate-500 to-slate-600', bg: 'bg-slate-50' },
    { label: 'Applied', count: stats.applied || 0, icon: Briefcase, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50' },
    { label: 'Interview', count: stats.interview || 0, icon: CheckCircle2, color: 'from-purple-500 to-purple-600', bg: 'bg-purple-50' },
    { label: 'Offer', count: stats.offer || 0, icon: Gift, color: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Rejected', count: stats.rejected || 0, icon: XCircle, color: 'from-rose-500 to-rose-600', bg: 'bg-rose-50' },
    { label: 'Ghosted', count: stats.ghosted || 0, icon: Ghost, color: 'from-amber-500 to-amber-600', bg: 'bg-amber-50' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold font-heading mb-2 tracking-tight">
                Welcome back, <span className="bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent">{user?.name}</span>
              </h1>
              <p className="text-slate-600 text-lg">Track your job applications and land your dream role</p>
            </div>
            <Button
              data-testid="add-job-button"
              onClick={() => setIsModalOpen(true)}
              className="h-12 px-6 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-semibold shadow-lg shadow-orange-500/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 active:scale-95"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Job
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {statusCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                data-testid={`status-card-${card.label.toLowerCase()}`}
                className={`${card.bg} rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
              >
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${card.color} mb-3 shadow-sm`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-3xl font-bold font-heading mb-1">{card.count}</div>
                <div className="text-sm font-medium text-slate-600">{card.label}</div>
              </motion.div>
            );
          })}
        </div>

        <div>
          <h2 className="text-2xl font-semibold font-heading mb-4">Recent Applications</h2>
          {jobs.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
              <Briefcase className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No applications yet</h3>
              <p className="text-slate-600 mb-6">Start tracking your job applications to see them here</p>
              <Button
                onClick={() => setIsModalOpen(true)}
                className="h-12 px-8 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Your First Job
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {jobs.slice(0, 10).map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onDelete={handleJobDeleted}
                  onUpdate={handleJobUpdated}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <AddJobModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onJobAdded={handleJobAdded}
      />
    </div>
  );
};

export default Dashboard;