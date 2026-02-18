# AI Chat Enhancements - CareerFlow

## Overview
The AI chat assistant now has **function calling** capabilities, allowing it to interact with your actual job data in the database.

## New Features

### 1. Database Access via Function Calling
The AI can now:
- **Get Jobs**: View all your job applications or filter by status
- **Update Status**: Change job application statuses
- **Add Jobs**: Create new job applications
- **Get Statistics**: View your application metrics

### 2. Improved Input Experience
- **Shift+Enter**: Create new lines in your message
- **Enter**: Send the message
- **Multiline Support**: Type longer, formatted messages

### 3. Chat Management
- **New Chat**: Start a fresh conversation (keeps history but creates new context)
- **Clear Chat**: Delete all chat history permanently
- Both buttons accessible from chat header

### 4. OpenRouter Support
- **Access 100+ Models**: One API key for OpenAI, Claude, Llama, Mistral, and more
- **Model Format**: Use `provider/model` syntax (e.g., `openai/gpt-4`, `anthropic/claude-3-opus`)
- **Cost Effective**: Often cheaper than direct API access
- **Get Started**: Sign up at openrouter.ai

### 5. Enhanced System Prompt
The AI now knows it's connected to CareerFlow and will proactively use tools to answer your questions.

## Example Interactions

### Before (Generic Response)
**You**: "What are my pending applications?"
**AI**: "Pending applications are job applications you have submitted but have not yet received a final decision for..."

### After (Data-Driven Response)
**You**: "What are my pending applications?"
**AI**: "You have 2 pending applications:
1. Full Stack Engineer at BigTech Inc (Remote)
2. Frontend Developer at StartupXYZ (Austin, TX)

Would you like me to update any of these statuses?"

### Update Job Status
**You**: "Change the Full Stack Engineer to applied"
**AI**: "✓ Updated Full Stack Engineer at BigTech Inc status to 'applied'. Good luck! Would you like me to help you prepare for potential interviews?"

### Add New Job
**You**: "Add a new job: Senior Developer at Tech Corp in San Francisco"
**AI**: "✓ Added Senior Developer at Tech Corp to your tracker with 'pending' status. Would you like to add more details like salary range or notes?"

### Get Statistics
**You**: "How many applications do I have?"
**AI**: "Here's your current application summary:
- Total: 5 applications
- Applied: 1
- Interview: 2
- Pending: 2
- Rejected: 0

You're doing great! Keep the momentum going."

## Configuration Tips

### For Function Calling Support
Most modern LLMs support function calling. Recommended providers:
- ✅ OpenAI (gpt-4, gpt-3.5-turbo) - Excellent support
- ✅ OpenRouter (all models) - Proxy with function calling
- ✅ Anthropic Claude - Native support
- ⚠️ Local models (Ollama, LM Studio) - Support varies by model
  - Best: Mistral, Mixtral, Function-calling fine-tuned models
  - Limited: Base Llama2 models

### OpenRouter Setup
1. Go to openrouter.ai
2. Sign up and get API key
3. In CareerFlow Settings:
   - Provider: OpenRouter
   - Model: `openai/gpt-4` (or any model from openrouter.ai/models)
   - API Key: Your OpenRouter key
   - Base URL: Leave empty (auto-configured)

### Recommended Models for Function Calling

**Best (Cloud)**:
- `openai/gpt-4` - Most reliable
- `openai/gpt-4-turbo` - Fast and reliable
- `anthropic/claude-3-opus` - Excellent reasoning
- `anthropic/claude-3-sonnet` - Good balance

**Good (OpenRouter)**:
- `openai/gpt-3.5-turbo` - Fast and cheap
- `anthropic/claude-3-haiku` - Very fast
- `mistralai/mixtral-8x7b` - Open source, good quality

**Local (Varies)**:
- Mistral 7B Instruct v0.2
- Mixtral 8x7B
- CodeLlama (for code-related tasks)

## Troubleshooting

### AI Doesn't Use Functions
**Cause**: Model doesn't support function calling or configuration issue
**Solution**: 
- Try OpenAI GPT-4 or GPT-3.5-turbo
- Check that your model supports tool/function calling
- Verify LLM config is saved correctly in Settings

### Function Calls Fail
**Cause**: Database query error or permission issue
**Solution**:
- Check backend logs: `tail -f /var/log/supervisor/backend.err.log`
- Ensure you're logged in with valid token
- Try restarting backend: `sudo supervisorctl restart backend`

### Shift+Enter Not Working
**Cause**: Browser or keyboard issue
**Solution**:
- Try holding Shift longer before pressing Enter
- Check if browser extensions are interfering
- Use mouse to click Send button if needed

### Chat History Growing Too Large
**Solution**:
- Use "Clear Chat" button periodically
- Each session is independent (new session = fresh context)
- Old messages don't affect new chats

## Privacy & Data

### What's Stored
- Chat messages and responses (in your database)
- Session IDs for conversation context
- No messages are sent to third parties except your configured LLM provider

### What's Shared with LLM
- Your current message
- System prompt explaining the assistant's role
- Function call results (job data when AI requests it)
- Previous messages in current session

### What's NOT Shared
- Your password or authentication tokens
- Complete database contents (only what AI specifically requests)
- Other users' data
- Configuration details beyond what's needed

## Advanced Usage

### Multi-Step Operations
The AI can chain multiple function calls:

**You**: "Show me all interview stage jobs and mark the first one as rejected"
**AI**: 
1. Calls `get_jobs(status="interview")`
2. Shows you the list
3. Calls `update_job_status()` for the first one
4. Confirms the update

### Natural Language Updates
You can use casual language:

- "Mark that Google job as applied" ✓
- "Change status to interview" ✓  
- "Update it to rejected" ✓

The AI understands context from previous messages.

### Bulk Questions
Ask compound questions:

**You**: "How many pending apps do I have and which companies are they?"
**AI** will get stats AND list the specific jobs in one response.

## Future Enhancements

Planned features:
- [ ] Image upload for job posting screenshots (OCR to extract details)
- [ ] Interview prep generation directly from chat
- [ ] Email parsing from pasted content
- [ ] Job description analysis
- [ ] Resume tailoring suggestions
- [ ] Follow-up reminders and task creation
- [ ] Multi-modal responses (charts, tables)

## Support

If you encounter issues:
1. Check Settings page - ensure LLM is configured
2. Try "New Chat" button
3. Check backend logs for errors
4. Test with a simple query: "Hello"
5. Verify your API key is valid and has credits

For OpenRouter issues:
- Check your account at openrouter.ai
- Verify API key is active
- Check usage limits/credits
