import React, { useState, useEffect } from 'react';
import { companiesApi } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Card, CardContent } from '../components/ui/card';
import { Building2, Plus, Trash2, CheckCircle2, XCircle, Users } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Switch } from '../components/ui/switch';

const CompaniesPage = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    about: '',
    stem_support: false,
    visa_sponsor: false,
    employee_count: '',
    research: '',
    user_comments: ''
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await companiesApi.getAll();
      setCompanies(response.data);
    } catch (error) {
      toast.error('Failed to fetch companies');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await companiesApi.create(formData);
      toast.success('Company added successfully!');
      setFormData({
        name: '',
        about: '',
        stem_support: false,
        visa_sponsor: false,
        employee_count: '',
        research: '',
        user_comments: ''
      });
      setIsModalOpen(false);
      fetchCompanies();
    } catch (error) {
      toast.error('Failed to add company');
    }
  };

  const handleDelete = async (id, companyName) => {
    try {
      await companiesApi.delete(id);
      toast.success('Company moved to trash', {
        description: companyName,
        action: {
          label: 'Undo',
          onClick: async () => {
            try {
              const { default: api } = await import('../lib/api');
              await api.post(`/trash/restore/company/${id}`);
              toast.success('Company restored');
              fetchCompanies();
            } catch (error) {
              toast.error('Failed to restore');
            }
          }
        }
      });
      fetchCompanies();
    } catch (error) {
      toast.error('Failed to delete company');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold font-heading mb-2 tracking-tight">
              Companies
            </h1>
            <p className="text-slate-600 text-lg">Track companies and their visa/STEM policies</p>
          </div>
          <Button
            data-testid="add-company-button"
            onClick={() => setIsModalOpen(true)}
            className="h-12 px-6 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Company
          </Button>
        </div>

        {companies.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
            <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No companies yet</h3>
            <p className="text-slate-600 mb-6">Start tracking companies and their policies</p>
            <Button onClick={() => setIsModalOpen(true)} className="h-12 px-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500">
              <Plus className="w-5 h-5 mr-2" />
              Add Your First Company
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map((company, index) => (
              <motion.div
                key={company.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-slate-200 rounded-2xl h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mb-3">
                          <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold font-heading mb-2">{company.name}</h3>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(company.id, company.name)}
                        className="rounded-full text-rose-600 hover:bg-rose-50"
                        data-testid={`delete-company-${company.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {company.about && (
                      <p className="text-sm text-slate-600 mb-4 line-clamp-3">{company.about}</p>
                    )}

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        {company.visa_sponsor ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-slate-400" />
                        )}
                        <span className={company.visa_sponsor ? 'text-emerald-700 font-medium' : 'text-slate-600'}>
                          Visa Sponsorship
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        {company.stem_support ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-slate-400" />
                        )}
                        <span className={company.stem_support ? 'text-emerald-700 font-medium' : 'text-slate-600'}>
                          STEM-OPT Support
                        </span>
                      </div>
                      {company.employee_count && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Users className="w-4 h-4" />
                          <span>{company.employee_count} employees</span>
                        </div>
                      )}
                    </div>

                    {company.user_comments && (
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <p className="text-xs text-slate-600 italic line-clamp-2">"{company.user_comments}"</p>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold font-heading">Add New Company</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Company Name *</Label>
              <Input
                id="name"
                data-testid="company-name-input"
                placeholder="Tech Corp"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="h-12 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="about">About Company</Label>
              <Textarea
                id="about"
                placeholder="Brief description..."
                value={formData.about}
                onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                rows={3}
                className="rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employee_count">Employee Count</Label>
                <Input
                  id="employee_count"
                  placeholder="1000-5000"
                  value={formData.employee_count}
                  onChange={(e) => setFormData({ ...formData, employee_count: e.target.value })}
                  className="h-12 rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <Label htmlFor="visa_sponsor" className="cursor-pointer">Offers Visa Sponsorship</Label>
              <Switch
                id="visa_sponsor"
                checked={formData.visa_sponsor}
                onCheckedChange={(checked) => setFormData({ ...formData, visa_sponsor: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <Label htmlFor="stem_support" className="cursor-pointer">STEM-OPT Support</Label>
              <Switch
                id="stem_support"
                checked={formData.stem_support}
                onCheckedChange={(checked) => setFormData({ ...formData, stem_support: checked })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="research">Research/Notes</Label>
              <Textarea
                id="research"
                placeholder="Your research about this company..."
                value={formData.research}
                onChange={(e) => setFormData({ ...formData, research: e.target.value })}
                rows={3}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user_comments">Personal Comments</Label>
              <Textarea
                id="user_comments"
                placeholder="Your thoughts..."
                value={formData.user_comments}
                onChange={(e) => setFormData({ ...formData, user_comments: e.target.value })}
                rows={2}
                className="rounded-xl"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1 h-12 rounded-full">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600">
                Add Company
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompaniesPage;