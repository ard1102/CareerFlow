import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { FileText, Download, Wand2 } from 'lucide-react';
import { toast } from 'sonner';

const ResumeBuilderPage = () => {
  const [resume, setResume] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [suggestions, setSuggestions] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await api.get('/jobs');
      setJobs(response.data);
    } catch (error) {
      toast.error('Failed to fetch jobs');
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await api.post('/resume/generate', { job_id: selectedJob || null });
      setResume(response.data);
      toast.success('Resume generated!');
    } catch (error) {
      toast.error('Failed to generate resume');
    } finally {
      setLoading(false);
    }
  };

  const handleTailorWithAI = async () => {
    if (!selectedJob) {
      toast.error('Please select a job first');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/resume/tailor', { job_id: selectedJob });
      setSuggestions(response.data.suggestions);
      toast.success('AI suggestions ready!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to generate suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const dataStr = JSON.stringify(resume, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'resume.json';
    link.click();
    toast.success('Resume downloaded!');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold font-heading mb-8">Resume Builder</h1>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card className="border-slate-200 rounded-2xl">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Generate Resume</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Tailor for Job (Optional)</label>
                  <select value={selectedJob} onChange={(e) => setSelectedJob(e.target.value)} className="w-full h-12 rounded-xl border px-3">
                    <option value="">General Resume</option>
                    {jobs.map(j => <option key={j.id} value={j.id}>{j.title} at {j.company}</option>)}
                  </select>
                </div>
                <Button onClick={handleGenerate} disabled={loading} className="w-full h-12 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500">
                  <FileText className="w-4 h-4 mr-2" />
                  {loading ? 'Generating...' : 'Generate Resume'}
                </Button>
                {selectedJob && (
                  <Button onClick={handleTailorWithAI} disabled={loading} variant="outline" className="w-full h-12 rounded-full">
                    <Wand2 className="w-4 h-4 mr-2" />
                    Get AI Tailoring Suggestions
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {suggestions && (
            <Card className="border-violet-200 rounded-2xl bg-gradient-to-br from-violet-50 to-purple-50">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">AI Suggestions</h2>
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap text-sm bg-white/50 p-4 rounded-xl">{suggestions}</pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {resume && (
          <Card className="border-slate-200 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Your Resume</h2>
                <Button onClick={handleDownload} variant="outline" className="rounded-full">
                  <Download className="w-4 h-4 mr-2" />
                  Download JSON
                </Button>
              </div>

              <div className="space-y-6 bg-white p-8 rounded-xl border">
                <div>
                  <h3 className="text-2xl font-bold mb-1">{resume.personal_info.name}</h3>
                  <p className="text-slate-600">{resume.personal_info.email}</p>
                  <p className="text-slate-600">{resume.personal_info.location}</p>
                  <p className="text-sm text-slate-500">{resume.personal_info.years_experience} years experience</p>
                </div>

                {resume.summary && (
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Professional Summary</h4>
                    <p className="text-slate-700">{resume.summary}</p>
                  </div>
                )}

                {resume.skills.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {resume.skills.map((skill, idx) => (
                        <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">{skill}</span>
                      ))}
                    </div>
                  </div>
                )}

                {resume.projects.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Projects</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {resume.projects.map((project, idx) => (
                        <li key={idx} className="text-slate-700">{project}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {resume.education.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Education</h4>
                    <ul className="space-y-1">
                      {resume.education.map((edu, idx) => (
                        <li key={idx} className="text-slate-700">{edu}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {resume.work_authorization && (
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Work Authorization</h4>
                    <p className="text-slate-700">{resume.work_authorization}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ResumeBuilderPage;
