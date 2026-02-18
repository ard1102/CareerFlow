import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { jobsApi } from '../lib/api';
import { toast } from 'sonner';

const AddJobModal = ({ open, onClose, onJobAdded }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    posting_url: '',
    description: '',
    pay: '',
    work_auth: '',
    location: '',
    status: 'pending',
    notes: '',
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await jobsApi.create(formData);
      toast.success('Job added successfully!');
      setFormData({
        title: '',
        company: '',
        posting_url: '',
        description: '',
        pay: '',
        work_auth: '',
        location: '',
        status: 'pending',
        notes: '',
      });
      onJobAdded();
    } catch (error) {
      toast.error('Failed to add job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold font-heading">Add New Job Application</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                data-testid="job-title-input"
                placeholder="Senior Software Engineer"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                required
                className="h-12 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company *</Label>
              <Input
                id="company"
                data-testid="job-company-input"
                placeholder="Tech Corp"
                value={formData.company}
                onChange={(e) => handleChange('company', e.target.value)}
                required
                className="h-12 rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="posting_url">Job Posting URL</Label>
            <Input
              id="posting_url"
              data-testid="job-url-input"
              type="url"
              placeholder="https://..."
              value={formData.posting_url}
              onChange={(e) => handleChange('posting_url', e.target.value)}
              className="h-12 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                data-testid="job-location-input"
                placeholder="San Francisco, CA"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pay">Salary Range</Label>
              <Input
                id="pay"
                data-testid="job-pay-input"
                placeholder="$100k - $150k"
                value={formData.pay}
                onChange={(e) => handleChange('pay', e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="work_auth">Work Auth</Label>
              <Input
                id="work_auth"
                data-testid="job-work-auth-input"
                placeholder="H1B, OPT, etc."
                value={formData.work_auth}
                onChange={(e) => handleChange('work_auth', e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
              <SelectTrigger data-testid="job-status-select" className="h-12 rounded-xl">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="applied">Applied</SelectItem>
                <SelectItem value="interview">Interview</SelectItem>
                <SelectItem value="offer">Offer</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="ghosted">Ghosted</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Job Description</Label>
            <Textarea
              id="description"
              data-testid="job-description-input"
              placeholder="Paste the job description here..."
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={4}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              data-testid="job-notes-input"
              placeholder="Any additional notes..."
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
              className="rounded-xl"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 h-12 rounded-full"
              data-testid="job-cancel-button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              data-testid="job-submit-button"
              className="flex-1 h-12 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white shadow-lg shadow-orange-500/30"
            >
              {loading ? 'Adding...' : 'Add Job'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddJobModal;