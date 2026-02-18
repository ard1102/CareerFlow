import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { llmConfigApi } from '../lib/api';
import { toast } from 'sonner';
import { Settings as SettingsIcon, Zap, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const SettingsPage = () => {
  const [config, setConfig] = useState({
    provider: '',
    model: '',
    api_key: '',
    base_url: ''
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await llmConfigApi.get();
      if (response.data) {
        setConfig(response.data);
        setSaved(true);
      }
    } catch (error) {
      console.error('Failed to fetch config');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await llmConfigApi.create(config);
      toast.success('LLM configuration saved successfully!');
      setSaved(true);
    } catch (error) {
      toast.error('Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  const providers = [
    { value: 'openai', label: 'OpenAI (GPT)' },
    { value: 'anthropic', label: 'Anthropic (Claude)' },
    { value: 'gemini', label: 'Google Gemini' },
    { value: 'openrouter', label: 'OpenRouter (Multiple Models)' },
    { value: 'ollama', label: 'Ollama (Local)' },
    { value: 'openai_compatible', label: 'OpenAI-Compatible (LM Studio, vLLM, etc.)' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <SettingsIcon className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold font-heading tracking-tight">Settings</h1>
          </div>
          <p className="text-slate-600 text-lg">Configure your AI assistant and preferences</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8"
        >
          <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-2xl p-4 mb-6 flex gap-3">
            <Zap className="w-6 h-6 text-violet-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-violet-900">
              <strong>NEW: OpenAI-Compatible Support!</strong> You can now use any OpenAI-compatible API including LM Studio, vLLM, Ollama (with OpenAI mode), text-generation-webui, Groq, Together AI, and more. Just select "OpenAI-Compatible" as provider and enter your server's base URL.
            </div>
          </div>

          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold font-heading mb-1">LLM Configuration</h2>
              <p className="text-sm text-slate-600">Set up your AI provider for the chat assistant</p>
            </div>
            {saved && (
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-medium">Configured</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="provider">Provider *</Label>
              <Select value={config.provider} onValueChange={(value) => setConfig({ ...config, provider: value })}>
                <SelectTrigger data-testid="provider-select" className="h-12 rounded-xl">
                  <SelectValue placeholder="Select LLM provider" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">Choose your LLM provider (Ollama for local models)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Model Name *</Label>
              <Input
                id="model"
                data-testid="model-input"
                placeholder={
                  config.provider === 'openrouter'
                    ? 'e.g., openai/gpt-4, anthropic/claude-3-opus, meta-llama/llama-2-70b'
                    : 'e.g., gpt-4, claude-3, llama2, gemini-pro'
                }
                value={config.model}
                onChange={(e) => setConfig({ ...config, model: e.target.value })}
                required
                className="h-12 rounded-xl"
              />
              <p className="text-xs text-slate-500">
                {config.provider === 'openrouter'
                  ? 'OpenRouter uses format: provider/model (e.g., openai/gpt-4). See models at openrouter.ai/models'
                  : 'Enter the specific model name (e.g., gpt-4, claude-3-sonnet-20240229, llama2)'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="api_key">API Key {config.provider !== 'ollama' && config.provider !== 'openai_compatible' && '*'}</Label>
              <Input
                id="api_key"
                data-testid="api-key-input"
                type="password"
                placeholder={
                  config.provider === 'ollama' || config.provider === 'openai_compatible'
                    ? 'Optional (not required for most local servers)'
                    : config.provider === 'openrouter'
                    ? 'Get from openrouter.ai'
                    : 'Enter your API key'
                }
                value={config.api_key}
                onChange={(e) => setConfig({ ...config, api_key: e.target.value })}
                required={config.provider !== 'ollama' && config.provider !== 'openai_compatible'}
                disabled={config.provider === 'ollama'}
                className="h-12 rounded-xl"
              />
              <p className="text-xs text-slate-500">
                {config.provider === 'openai_compatible' 
                  ? 'Most OpenAI-compatible servers don\'t require an API key. Use "dummy" if required by server.'
                  : config.provider === 'openrouter'
                  ? 'Get your API key from openrouter.ai - Access to 100+ models with one key!'
                  : 'Your API key is stored securely and never shared'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="base_url">Base URL {(config.provider === 'ollama' || config.provider === 'openai_compatible') && '*'}</Label>
              <Input
                id="base_url"
                data-testid="base-url-input"
                type="url"
                placeholder={
                  config.provider === 'ollama' 
                    ? 'http://localhost:11434' 
                    : config.provider === 'openai_compatible'
                    ? 'http://localhost:1234/v1 (LM Studio) or http://localhost:8000/v1 (vLLM)'
                    : 'Optional - for custom endpoints'
                }
                value={config.base_url}
                onChange={(e) => setConfig({ ...config, base_url: e.target.value })}
                required={config.provider === 'ollama' || config.provider === 'openai_compatible'}
                className="h-12 rounded-xl"
              />
              <p className="text-xs text-slate-500">
                {config.provider === 'openai_compatible'
                  ? 'Must include /v1 at the end (e.g., http://localhost:1234/v1)'
                  : 'Required for Ollama or custom endpoints (e.g., http://localhost:11434)'}
              </p>
            </div>

            <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 flex gap-3">
              <Zap className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-sky-900">
                <strong>LiteLLM Support:</strong> This app uses LiteLLM, which supports OpenAI, Anthropic, Gemini, and local models via Ollama or LM Studio.
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              data-testid="save-config-button"
              className="w-full h-12 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-semibold shadow-lg shadow-orange-500/30 transition-all duration-300 active:scale-95"
            >
              {loading ? 'Saving...' : 'Save Configuration'}
            </Button>
          </form>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl border border-indigo-200 p-6"
        >
          <h3 className="text-lg font-semibold font-heading mb-3">Getting Started with LLM Providers</h3>
          <ul className="space-y-2 text-sm text-slate-700">
            <li className="flex items-start gap-2">
              <span className="text-orange-500 font-bold mt-0.5">•</span>
              <span><strong>OpenAI:</strong> Use model "gpt-4" or "gpt-3.5-turbo". Get API key from platform.openai.com</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 font-bold mt-0.5">•</span>
              <span><strong>Claude:</strong> Use "claude-3-opus-20240229" or "claude-3-sonnet-20240229". Get key from console.anthropic.com</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 font-bold mt-0.5">•</span>
              <span><strong>Gemini:</strong> Use "gemini-pro". Get API key from makersuite.google.com</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 font-bold mt-0.5">•</span>
              <span><strong>Ollama:</strong> Install locally, use model name like "llama2" or "mistral" and base_url "http://localhost:11434"</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 font-bold mt-0.5">•</span>
              <span><strong>LM Studio:</strong> Select "OpenAI-Compatible", use any model name loaded in LM Studio, base_url "http://localhost:1234/v1"</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 font-bold mt-0.5">•</span>
              <span><strong>vLLM / text-generation-webui:</strong> Select "OpenAI-Compatible", model name from server, base_url with /v1 endpoint</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 font-bold mt-0.5">•</span>
              <span><strong>Any OpenAI-compatible API:</strong> Works with Groq, Together AI, Perplexity, LocalAI, and more!</span>
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
};

export default SettingsPage;