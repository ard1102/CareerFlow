import React, { useState } from 'react';
import api from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Wand2, FileText, Mail, Globe, Search, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const JobToolsPage = () => {
  const [loading, setLoading] = useState(false);
  const [parseResult, setParseResult] = useState(null);
  const [emailResult, setEmailResult] = useState(null);
  const [scrapeResult, setScrapeResult] = useState(null);
  const [searchResults, setSearchResults] = useState(null);

  const handleParseDescription = async (e) => {
    e.preventDefault();
    setLoading(true);
    const description = e.target.description.value;
    try {
      const response = await api.post('/ai/parse-job-description', { description });
      setParseResult(response.data);
      toast.success('Job description parsed!');
    } catch (error) {
      toast.error('Failed to parse');
    } finally {
      setLoading(false);
    }
  };

  const handleParseEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    const email_content = e.target.email_content.value;
    try {
      const response = await api.post('/ai/parse-email', { email_content });
      setEmailResult(response.data);
      toast.success('Email parsed!');
    } catch (error) {
      toast.error('Failed to parse email');
    } finally {
      setLoading(false);
    }
  };

  const handleScrapeJob = async (e) => {
    e.preventDefault();
    setLoading(true);
    const url = e.target.url.value;
    try {
      const response = await api.post('/ai/scrape-job', { url });
      setScrapeResult(response.data);
      toast.success('Job scraped!');
    } catch (error) {
      toast.error('Failed to scrape');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchJobs = async (e) => {
    e.preventDefault();
    setLoading(true);
    const query = e.target.query.value;
    const location = e.target.location.value;
    try {
      const response = await api.post('/ai/search-jobs', { query, location });
      setSearchResults(response.data);
      toast.success('Search results generated!');
    } catch (error) {
      toast.error('Failed to search');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
              <Wand2 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold font-heading tracking-tight">AI Job Tools</h1>
          </div>
          <p className="text-slate-600 text-lg">Parse descriptions, scrape jobs, and extract information</p>
        </motion.div>

        <Tabs defaultValue="parse" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-14 bg-white rounded-xl border border-slate-200">
            <TabsTrigger value="parse" className="rounded-lg data-[state=active]:bg-violet-100 data-[state=active]:text-violet-700">
              <FileText className="w-4 h-4 mr-2" />
              Parse Description
            </TabsTrigger>
            <TabsTrigger value="email" className="rounded-lg data-[state=active]:bg-violet-100 data-[state=active]:text-violet-700">
              <Mail className="w-4 h-4 mr-2" />
              Parse Email
            </TabsTrigger>
            <TabsTrigger value="scrape" className="rounded-lg data-[state=active]:bg-violet-100 data-[state=active]:text-violet-700">
              <Globe className="w-4 h-4 mr-2" />
              Scrape URL
            </TabsTrigger>
            <TabsTrigger value="search" className="rounded-lg data-[state=active]:bg-violet-100 data-[state=active]:text-violet-700">
              <Search className="w-4 h-4 mr-2" />
              Search Jobs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="parse">
            <Card className="border-slate-200 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-2xl font-heading">Parse Job Description</CardTitle>
                <p className="text-sm text-slate-600">Extract skills, requirements, and key information from job descriptions</p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleParseDescription} className="space-y-4">
                  <Textarea name="description" placeholder="Paste job description here..." rows={12} className="rounded-xl" required />
                  <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500">
                    {loading ? 'Parsing...' : 'Parse Description'}
                  </Button>
                </form>

                {parseResult && (
                  <div className="mt-6 space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Skills Detected ({parseResult.skills?.length || 0}):</h3>
                      <div className="flex flex-wrap gap-2">
                        {parseResult.skills?.map((skill, idx) => (
                          <span key={idx} className="px-3 py-1 text-sm bg-violet-100 text-violet-700 rounded-full">{skill}</span>
                        ))}
                      </div>
                    </div>
                    {parseResult.experience_years && (
                      <div>
                        <h3 className="font-semibold">Experience Required:</h3>
                        <p className="text-slate-600">{parseResult.experience_years}+ years</p>
                      </div>
                    )}
                    {parseResult.requirements?.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2">Requirements:</h3>
                        <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
                          {parseResult.requirements.slice(0, 5).map((req, idx) => <li key={idx}>{req}</li>)}
                        </ul>
                      </div>
                    )}
                    {parseResult.benefits?.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2">Benefits:</h3>
                        <div className="flex flex-wrap gap-2">
                          {parseResult.benefits.map((benefit, idx) => (
                            <span key={idx} className="px-3 py-1 text-sm bg-emerald-100 text-emerald-700 rounded-full">{benefit}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email">
            <Card className="border-slate-200 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-2xl font-heading">Parse Email</CardTitle>
                <p className="text-sm text-slate-600">Extract job information from email content or messages</p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleParseEmail} className="space-y-4">
                  <Textarea name="email_content" placeholder="Paste email content here..." rows={12} className="rounded-xl" required />
                  <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500">
                    {loading ? 'Parsing...' : 'Parse Email'}
                  </Button>
                </form>

                {emailResult && (
                  <div className="mt-6 space-y-3 p-4 bg-violet-50 rounded-xl">
                    {emailResult.title && <div><strong>Title:</strong> {emailResult.title}</div>}
                    {emailResult.company && <div><strong>Company:</strong> {emailResult.company}</div>}
                    {emailResult.location && <div><strong>Location:</strong> {emailResult.location}</div>}
                    {emailResult.pay && <div><strong>Pay:</strong> {emailResult.pay}</div>}
                    {emailResult.posting_url && (
                      <div><strong>URL:</strong> <a href={emailResult.posting_url} target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:underline">{emailResult.posting_url}</a></div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scrape">
            <Card className="border-slate-200 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-2xl font-heading">Scrape Job URL</CardTitle>
                <p className="text-sm text-slate-600">Extract job details from LinkedIn, Indeed, Monster, or JobDiva</p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleScrapeJob} className="space-y-4">
                  <div>
                    <Label htmlFor="url">Job Posting URL</Label>
                    <Input name="url" type="url" placeholder="https://..." className="h-12 rounded-xl mt-2" required />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500">
                    {loading ? 'Scraping...' : 'Scrape Job'}
                  </Button>
                </form>

                {scrapeResult && (
                  <div className="mt-6 space-y-3 p-4 bg-violet-50 rounded-xl">
                    <div><strong>Source:</strong> {scrapeResult.source}</div>
                    {scrapeResult.title && <div><strong>Title:</strong> {scrapeResult.title}</div>}
                    {scrapeResult.company && <div><strong>Company:</strong> {scrapeResult.company}</div>}
                    {scrapeResult.location && <div><strong>Location:</strong> {scrapeResult.location}</div>}
                    {scrapeResult.pay && <div><strong>Pay:</strong> {scrapeResult.pay}</div>}
                    {scrapeResult.description && (
                      <div>
                        <strong>Description:</strong>
                        <p className="text-sm text-slate-600 mt-1 max-h-40 overflow-y-auto">{scrapeResult.description}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="search">
            <Card className="border-slate-200 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-2xl font-heading">Search Jobs</CardTitle>
                <p className="text-sm text-slate-600">Get search URLs for multiple job portals</p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSearchJobs} className="space-y-4">
                  <div>
                    <Label htmlFor="query">Job Title / Keywords</Label>
                    <Input name="query" placeholder="Software Engineer" className="h-12 rounded-xl mt-2" required />
                  </div>
                  <div>
                    <Label htmlFor="location">Location (Optional)</Label>
                    <Input name="location" placeholder="San Francisco, CA" className="h-12 rounded-xl mt-2" />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500">
                    {loading ? 'Searching...' : 'Generate Search URLs'}
                  </Button>
                </form>

                {searchResults && (
                  <div className="mt-6 space-y-3">
                    {searchResults.map((result, idx) => (
                      <Card key={idx} className="bg-violet-50 border-violet-200">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold text-violet-900">{result.portal}</h4>
                              <p className="text-sm text-violet-600 mt-1">{result.note}</p>
                            </div>
                            <Button variant="outline" size="sm" asChild className="rounded-full">
                              <a href={result.search_url} target="_blank" rel="noopener noreferrer">
                                Open
                              </a>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default JobToolsPage;
