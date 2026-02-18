import React, { useState, useEffect } from 'react';
import { contactsApi, companiesApi } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent } from '../components/ui/card';
import { Users, Plus, Trash2, Mail, Phone, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { formatDate } from '../lib/utils';

const ContactsPage = () => {
  const [contacts, setContacts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company_id: '',
    role: '',
    how_met: '',
    notes: '',
    last_touch_date: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [contactsRes, companiesRes] = await Promise.all([
        contactsApi.getAll(),
        companiesApi.getAll()
      ]);
      setContacts(contactsRes.data);
      setCompanies(companiesRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const getCompanyName = (companyId) => {
    const company = companies.find(c => c.id === companyId);
    return company?.name || 'Unknown';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await contactsApi.create(formData);
      toast.success('Contact added!');
      setFormData({
        name: '',
        email: '',
        phone: '',
        company_id: '',
        role: '',
        how_met: '',
        notes: '',
        last_touch_date: ''
      });
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to add contact');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this contact?')) return;
    try {
      await contactsApi.delete(id);
      toast.success('Contact deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete contact');
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold font-heading mb-2 tracking-tight">Contacts</h1>
            <p className="text-slate-600 text-lg">Network and track your professional connections</p>
          </div>
          <Button
            data-testid="add-contact-button"
            onClick={() => setIsModalOpen(true)}
            className="h-12 px-6 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-semibold shadow-lg shadow-teal-500/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Contact
          </Button>
        </div>

        {contacts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No contacts yet</h3>
            <p className="text-slate-600 mb-6">Start building your professional network</p>
            <Button onClick={() => setIsModalOpen(true)} className="h-12 px-8 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500">
              <Plus className="w-5 h-5 mr-2" />
              Add Your First Contact
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contacts.map((contact, index) => (
              <motion.div key={contact.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-slate-200 rounded-2xl h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center mb-3 text-white font-bold text-lg">
                          {contact.name.charAt(0)}
                        </div>
                        <h3 className="text-xl font-semibold font-heading mb-1">{contact.name}</h3>
                        {contact.role && <p className="text-sm text-slate-600 mb-1">{contact.role}</p>}
                        {contact.company_id && (
                          <p className="text-sm font-medium text-indigo-600">{getCompanyName(contact.company_id)}</p>
                        )}
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(contact.id)} className="rounded-full text-rose-600 hover:bg-rose-50">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {contact.email && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Mail className="w-4 h-4" />
                          <a href={`mailto:${contact.email}`} className="hover:text-teal-600">{contact.email}</a>
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Phone className="w-4 h-4" />
                          <span>{contact.phone}</span>
                        </div>
                      )}
                    </div>

                    {contact.how_met && (
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <p className="text-xs text-slate-500 mb-1">How we met:</p>
                        <p className="text-sm text-slate-700">{contact.how_met}</p>
                      </div>
                    )}

                    {contact.last_touch_date && (
                      <div className="mt-3">
                        <p className="text-xs text-slate-500">Last contact: {formatDate(contact.last_touch_date)}</p>
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
            <DialogTitle className="text-2xl font-bold font-heading">Add New Contact</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" data-testid="contact-name-input" placeholder="John Doe" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="h-12 rounded-xl" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="john@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" placeholder="+1 (555) 123-4567" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="h-12 rounded-xl" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_id">Company</Label>
                <Select value={formData.company_id} onValueChange={(value) => setFormData({ ...formData, company_id: value })}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role/Title</Label>
                <Input id="role" placeholder="Hiring Manager" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="h-12 rounded-xl" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="how_met">How We Met</Label>
              <Input id="how_met" placeholder="LinkedIn, referral, conference, etc." value={formData.how_met} onChange={(e) => setFormData({ ...formData, how_met: e.target.value })} className="h-12 rounded-xl" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" placeholder="Additional notes..." value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} className="rounded-xl" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_touch_date">Last Touch Date</Label>
              <Input id="last_touch_date" type="date" value={formData.last_touch_date} onChange={(e) => setFormData({ ...formData, last_touch_date: e.target.value })} className="h-12 rounded-xl" />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1 h-12 rounded-full">Cancel</Button>
              <Button type="submit" className="flex-1 h-12 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600">Add Contact</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContactsPage;