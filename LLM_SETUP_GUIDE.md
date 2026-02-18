# LLM Setup Guide for CareerFlow

CareerFlow supports multiple LLM providers through LiteLLM, including OpenAI-compatible APIs.

## Supported Providers

### 1. OpenAI (Cloud)
- **Provider**: `openai`
- **Models**: `gpt-4`, `gpt-4-turbo`, `gpt-3.5-turbo`
- **API Key**: Required (get from https://platform.openai.com)
- **Base URL**: Leave empty (uses default)

### 2. Anthropic Claude (Cloud)
- **Provider**: `anthropic`
- **Models**: `claude-3-opus-20240229`, `claude-3-sonnet-20240229`, `claude-3-haiku-20240307`
- **API Key**: Required (get from https://console.anthropic.com)
- **Base URL**: Leave empty

### 3. Google Gemini (Cloud)
- **Provider**: `gemini`
- **Models**: `gemini-pro`, `gemini-pro-vision`
- **API Key**: Required (get from https://makersuite.google.com)
- **Base URL**: Leave empty

### 4. Ollama (Local)
- **Provider**: `ollama`
- **Models**: Any model you have pulled (e.g., `llama2`, `mistral`, `codellama`, `llama3`)
- **API Key**: Not required
- **Base URL**: `http://localhost:11434` (or your Ollama server)

**Setup Ollama**:
```bash
# Install Ollama from https://ollama.ai
ollama pull llama2
ollama serve
```

### 5. OpenAI-Compatible (Local/Cloud)

This option works with ANY server that implements the OpenAI API format.

#### LM Studio (Recommended for Local)
- **Provider**: `openai_compatible`
- **Model**: Any model loaded in LM Studio (e.g., `mistral-7b-instruct`, `llama-2-7b-chat`)
- **API Key**: Not required (or use "dummy")
- **Base URL**: `http://localhost:1234/v1`

**Setup LM Studio**:
1. Download from https://lmstudio.ai
2. Download any model (Mistral, Llama, etc.)
3. Start the local server
4. Use the model name shown in LM Studio

#### vLLM (High Performance)
- **Provider**: `openai_compatible`
- **Model**: Model name you're serving
- **API Key**: Not required
- **Base URL**: `http://localhost:8000/v1`

**Setup vLLM**:
```bash
pip install vllm
python -m vllm.entrypoints.openai.api_server --model meta-llama/Llama-2-7b-chat-hf
```

#### text-generation-webui (Oobabooga)
- **Provider**: `openai_compatible`
- **Model**: Model name loaded in webui
- **API Key**: Not required
- **Base URL**: `http://localhost:5000/v1`

**Setup**:
1. Install from https://github.com/oobabooga/text-generation-webui
2. Load any model
3. Enable OpenAI extension
4. Start with `--api --extensions openai`

#### Ollama with OpenAI Compatibility
- **Provider**: `openai_compatible`
- **Model**: `llama2`, `mistral`, etc.
- **API Key**: Not required
- **Base URL**: `http://localhost:11434/v1`

Note: Ollama has native support, but you can also use it via OpenAI-compatible endpoint.

#### Groq (Cloud - Fast Inference)
- **Provider**: `openai_compatible`
- **Model**: `mixtral-8x7b-32768`, `llama2-70b-4096`
- **API Key**: Required (get from https://console.groq.com)
- **Base URL**: `https://api.groq.com/openai/v1`

#### Together AI (Cloud)
- **Provider**: `openai_compatible`
- **Model**: Various models available
- **API Key**: Required (get from https://together.ai)
- **Base URL**: `https://api.together.xyz/v1`

#### Perplexity (Cloud)
- **Provider**: `openai_compatible`
- **Model**: `pplx-7b-chat`, `pplx-70b-chat`
- **API Key**: Required (get from https://perplexity.ai)
- **Base URL**: `https://api.perplexity.ai`

#### LocalAI (Self-hosted)
- **Provider**: `openai_compatible`
- **Model**: Any model you've loaded
- **API Key**: May not be required (depends on setup)
- **Base URL**: Your LocalAI server URL with `/v1`

## Configuration Examples

### Example 1: LM Studio (Local, Free)
```
Provider: OpenAI-Compatible
Model: mistral-7b-instruct-v0.2
API Key: (leave empty or use "dummy")
Base URL: http://localhost:1234/v1
```

### Example 2: Ollama (Local, Free)
```
Provider: ollama
Model: llama2
API Key: (leave empty)
Base URL: http://localhost:11434
```

### Example 3: OpenAI (Cloud, Paid)
```
Provider: openai
Model: gpt-4
API Key: sk-...your-key...
Base URL: (leave empty)
```

### Example 4: Groq (Cloud, Free Tier)
```
Provider: OpenAI-Compatible
Model: mixtral-8x7b-32768
API Key: gsk_...your-key...
Base URL: https://api.groq.com/openai/v1
```

## Troubleshooting

### Chat returns error
1. Check that your server is running (for local providers)
2. Verify the base URL includes `/v1` at the end (for OpenAI-compatible)
3. Check the model name matches exactly what's loaded in your server
4. For local servers, ensure no firewall is blocking the connection

### Model not found
- For local servers: Verify the model is loaded and the name matches exactly
- For cloud providers: Check the model name is correct for that provider

### Connection timeout
- For local servers: Make sure the server is actually running
- Check if the port is correct (LM Studio: 1234, Ollama: 11434, vLLM: 8000)
- Try accessing the base URL in your browser to verify it's reachable

## Recommendations

### For Development/Testing (Free):
- **LM Studio** - Easiest to set up, good UI, works on Mac/Windows/Linux
- **Ollama** - Lightweight, command-line based, very fast
- **Groq** - Cloud-based, very fast inference, free tier available

### For Production (Self-hosted):
- **vLLM** - Best performance for high-throughput
- **text-generation-webui** - Good balance of features and ease of use

### For Production (Cloud):
- **OpenAI** - Most reliable, best models (GPT-4)
- **Anthropic Claude** - Excellent for complex reasoning
- **Groq** - Extremely fast inference, cost-effective

## Performance Tips

1. **Local Models**: Use quantized models (Q4, Q5) for faster inference with less RAM
2. **Context Length**: Shorter contexts = faster responses
3. **Temperature**: Lower temperature (0.3-0.7) for more focused responses
4. **Batch Size**: For vLLM, tune batch size based on your GPU memory

## Security Notes

- **Local providers**: No data leaves your machine
- **Cloud providers**: Data is sent to their servers
- **API Keys**: Stored securely in your database, never logged or shared
- **OpenAI-Compatible**: Security depends on the specific provider you choose
