import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { User, Briefcase, GraduationCap, MapPin, Globe, Upload, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const ProfilePage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    resume_summary: '',
    skills: '',
    projects: '',
    education: '',
    work_authorization: '',
    visa_status: '',
    previous_companies: '',
    location_preference: '',
    years_of_experience: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        resume_summary: user.resume_summary || '',
        skills: Array.isArray(user.skills) ? user.skills.join(', ') : '',
        projects: Array.isArray(user.projects) ? user.projects.join('\n') : '',
        education: Array.isArray(user.education) ? user.education.join('\n') : '',
        work_authorization: user.work_authorization || '',
        visa_status: user.visa_status || '',
        previous_companies: Array.isArray(user.previous_companies) ? user.previous_companies.join(', ') : '',
        location_preference: user.location_preference || '',
        years_of_experience: user.years_of_experience || ''
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const profileData = {
        name: formData.name,
        resume_summary: formData.resume_summary,
        skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
        projects: formData.projects.split('\n').filter(Boolean),
        education: formData.education.split('\n').filter(Boolean),
        work_authorization: formData.work_authorization,
        visa_status: formData.visa_status,
        previous_companies: formData.previous_companies.split(',').map(s => s.trim()).filter(Boolean),
        location_preference: formData.location_preference,
        years_of_experience: formData.years_of_experience ? parseInt(formData.years_of_experience) : null
      };

      await api.put('/auth/profile', profileData);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleResumeUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a PDF or DOCX file');
      return;
    }

    setUploading(true);
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    try {
      const response = await api.post('/resume/upload', uploadFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const parsed = response.data.parsed_data;
      
      // Pre-fill form with parsed data
      setFormData(prev => ({
        ...prev,
        name: parsed.name || prev.name,
        resume_summary: parsed.summary || prev.resume_summary,
        skills: parsed.skills ? parsed.skills.join(', ') : prev.skills,
        projects: parsed.projects ? parsed.projects.join('\n') : prev.projects,
        education: parsed.education ? parsed.education.join('\n') : prev.education,
        work_authorization: parsed.work_authorization || prev.work_authorization,
        years_of_experience: parsed.experience_years || prev.years_of_experience
      }));

      toast.success('Resume parsed! Review and save your profile.');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to parse resume');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold font-heading tracking-tight">My Profile</h1>
                <p className="text-slate-600 text-lg">Manage your resume, skills, and preferences</p>
              </div>
            </div>
            <div>
              <input
                type="file"
                id="resume-upload"
                accept=".pdf,.docx"
                onChange={handleResumeUpload}
                className="hidden"
              />
              <Button
                asChild
                disabled={uploading}
                className="h-12 px-6 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 cursor-pointer"
              >
                <label htmlFor="resume-upload" className="cursor-pointer flex items-center">
                  {uploading ? (
                    <>
                      <FileText className="w-5 h-5 mr-2 animate-pulse" />
                      Parsing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 mr-2" />
                      Upload Resume
                    </>
                  )}
                </label>
              </Button>
            </div>
          </div>
          <p className="text-sm text-slate-500 ml-16">Upload your resume (PDF or DOCX) to auto-fill your profile with AI</p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="border-slate-200 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-xl font-heading flex items-center gap-2">
                <User className="w-5 h-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="h-12 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="resume_summary">Professional Summary</Label>
                <Textarea
                  id="resume_summary"
                  placeholder="Brief summary of your professional background..."
                  value={formData.resume_summary}
                  onChange={(e) => setFormData({ ...formData, resume_summary: e.target.value })}
                  rows={4}
                  className="rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="years_of_experience">Years of Experience</Label>
                  <Input
                    id="years_of_experience"
                    type="number"
                    placeholder="5"
                    value={formData.years_of_experience}
                    onChange={(e) => setFormData({ ...formData, years_of_experience: e.target.value })}
                    className="h-12 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location_preference">Location Preference</Label>
                  <Input
                    id="location_preference"
                    placeholder="San Francisco, CA or Remote"
                    value={formData.location_preference}
                    onChange={(e) => setFormData({ ...formData, location_preference: e.target.value })}
                    className="h-12 rounded-xl"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-xl font-heading flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Skills & Experience
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="skills">Skills (comma-separated)</Label>
                <Textarea
                  id="skills"
                  placeholder="Python, React, AWS, Docker, SQL, Machine Learning"
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  rows={3}
                  className="rounded-xl"
                />
                <p className="text-xs text-slate-500">Separate skills with commas</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="projects">Key Projects (one per line)</Label>
                <Textarea
                  id="projects"
                  placeholder="Built e-commerce platform with React and Node.js&#10;Developed ML model for customer churn prediction&#10;Led team of 5 developers on microservices architecture"
                  value={formData.projects}
                  onChange={(e) => setFormData({ ...formData, projects: e.target.value })}
                  rows={5}
                  className="rounded-xl"
                />
                <p className="text-xs text-slate-500">One project per line</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-xl font-heading flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Education
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="education">Education (one per line)</Label>
                <Textarea
                  id="education"
                  placeholder="MS in Computer Science, Stanford University, 2020&#10;BS in Software Engineering, MIT, 2018"
                  value={formData.education}
                  onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                  rows={3}
                  className="rounded-xl"
                />
                <p className="text-xs text-slate-500">One degree per line</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-xl font-heading flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Work Authorization & Restrictions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="work_authorization">Work Authorization</Label>
                  <Input
                    id="work_authorization"
                    placeholder="US Citizen, Green Card, H1B, OPT, etc."
                    value={formData.work_authorization}
                    onChange={(e) => setFormData({ ...formData, work_authorization: e.target.value })}
                    className="h-12 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="visa_status">VISA Status</Label>
                  <Input
                    id="visa_status"
                    placeholder="F1, H1B, OPT, STEM-OPT, etc."
                    value={formData.visa_status}
                    onChange={(e) => setFormData({ ...formData, visa_status: e.target.value })}
                    className="h-12 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="previous_companies">Companies to Avoid (comma-separated)</Label>
                <Input
                  id="previous_companies"
                  placeholder="PreviousCompany1, PreviousCompany2"
                  value={formData.previous_companies}
                  onChange={(e) => setFormData({ ...formData, previous_companies: e.target.value })}
                  className="h-12 rounded-xl"
                />
                <p className="text-xs text-slate-500">Previous employers or companies you want to avoid</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 h-12 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold shadow-lg shadow-blue-500/30"
            >
              {loading ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
