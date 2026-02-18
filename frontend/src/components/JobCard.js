import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { ExternalLink, Trash2, Edit, MapPin, DollarSign, GraduationCap } from 'lucide-react';
import { getStatusColor, formatDate } from '../lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { motion } from 'framer-motion';

const JobCard = ({ job, onDelete, onUpdate, onInterviewPrep }) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleStatusChange = async (newStatus) => {
    await onUpdate(job.id, { ...job, status: newStatus });
    setIsEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      data-testid={`job-card-${job.id}`}
    >
      <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-slate-200 rounded-2xl overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold font-heading mb-1">{job.title}</h3>
                  <p className="text-lg text-slate-600 font-medium">{job.company}</p>
                </div>
                
                {isEditing ? (
                  <Select value={job.status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-32 h-9 rounded-full">
                      <SelectValue />
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
                ) : (
                  <div
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold border ${getStatusColor(job.status)}`}
                    data-testid={`job-status-badge-${job.status}`}
                  >
                    {job.status.toUpperCase()}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-slate-600 mb-4">
                {job.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{job.location}</span>
                  </div>
                )}
                {job.pay && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    <span>{job.pay}</span>
                  </div>
                )}
                {job.applied_date && (
                  <div>
                    Applied: {formatDate(job.applied_date)}
                  </div>
                )}
              </div>

              {job.notes && (
                <p className="text-sm text-slate-600 mb-4 line-clamp-2">{job.notes}</p>
              )}

              <div className="flex items-center gap-2">
                {job.posting_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="rounded-full h-9"
                  >
                    <a href={job.posting_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-1" />
                      View Posting
                    </a>
                  </Button>
                )}
                {job.description && (job.status === 'interview' || job.status === 'applied') && onInterviewPrep && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onInterviewPrep(job.id)}
                    className="rounded-full h-9 text-violet-600 hover:bg-violet-50"
                  >
                    <GraduationCap className="w-4 h-4 mr-1" />
                    Interview Prep
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  className="rounded-full h-9"
                  data-testid="job-edit-button"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  {isEditing ? 'Cancel' : 'Edit Status'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(job.id)}
                  className="rounded-full h-9 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                  data-testid="job-delete-button"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default JobCard;