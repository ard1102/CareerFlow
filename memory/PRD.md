# CareerFlow - Job Search Management Platform

## Product Overview
CareerFlow is a comprehensive job search management application designed to help candidates track their job applications, manage contacts, store knowledge, and leverage AI to streamline their job search process.

## Core Requirements

### User Management
- [x] JWT-based authentication (register/login)
- [x] User profile with resume info, skills, education
- [x] Work authorization and visa status tracking
- [x] Previous companies to avoid list

### Job Tracking
- [x] CRUD operations for job applications
- [x] Status tracking (pending, applied, interview, offer, rejected, ghosted)
- [x] Job details: title, company, location, pay, description, URL
- [x] Applied date tracking
- [x] Dashboard with job statistics

### Data Management
- [x] Companies: track potential employers with visa sponsor/STEM-OPT info
- [x] Contacts: networking contacts with company mapping
- [x] Job Portals: track job boards and success rates
- [x] Knowledge Base: store articles and notes
- [x] Prompts: library of useful prompts
- [x] To-Do Lists: task management with categories
- [x] Targets: goal tracking (applications, interviews, etc.)
- [x] Reminders: follow-up scheduling
- [x] **Trash/Undo System**: soft-delete with restore capability (NEW)

### Resume Features
- [x] **Resume PDF/DOCX Upload**: parse and auto-fill profile (FIXED)
- [x] Resume Builder page
- [x] AI-powered resume tailoring

### AI-Powered Features
- [x] AI Chat with function calling (LiteLLM integration)
- [x] Multiple LLM provider support (OpenAI, Claude, Gemini, OpenRouter, OpenAI-compatible)
- [x] Job description parsing
- [x] Interview question generation
- [x] **Company Research Tool**: AI can research companies (NEW)
- [x] **Company Update Tool**: AI can update company profiles (NEW)
- [ ] Email parsing (backend exists, no email integration)
- [ ] Knowledge base embeddings (not implemented)
- [ ] LinkedIn branding helper (not implemented)

## Technical Architecture

### Stack
- **Frontend**: React, Tailwind CSS, shadcn/ui, Framer Motion
- **Backend**: FastAPI, Motor (async MongoDB)
- **Database**: MongoDB
- **AI**: LiteLLM for multi-provider support

### Key Files
- `backend/server.py` - Main API (monolith, needs refactoring)
- `backend/resume_parser.py` - PDF/DOCX parsing with PyMuPDF
- `frontend/src/App.js` - Routes and navigation
- `frontend/src/pages/` - All page components

### Database Collections
- users, jobs, companies, contacts, knowledge, todos, prompts, job_portals, reminders, targets, systems, chat_messages, llm_configs

## What's Implemented (as of Dec 2025)

### Session 1 (Previous)
- Full authentication system
- Core CRUD for all modules
- AI chat with function calling
- Multi-LLM provider support
- Job parsing and interview prep tools

### Session 2 (Current - Dec 18, 2025)
1. **Resume PDF Parsing Fix (P0)**
   - Implemented PyMuPDF as primary parser
   - Added fallback to PyPDF2 and pdfplumber
   - Enhanced DOCX parsing with table support
   - Regex-based extraction for name, email, skills, education

2. **AI Company Research (P1)**
   - Added `research_company` AI tool
   - Added `update_company` AI tool
   - Tools provide research links and update company profiles

3. **Trash/Undo System (P1)**
   - Added `is_deleted` and `deleted_at` fields to models
   - Converted all DELETE endpoints to soft-delete
   - Created trash endpoints: GET /api/trash, restore, permanent delete
   - Created TrashPage.js frontend with restore/delete functionality
   - Added undo toast notifications on delete

## Remaining Work

### P2 (Priority 2)
- [ ] Add Edit buttons to all module list items
- [ ] Resume upload button on Resume Builder page
- [ ] Full email integration (connect to user email, parse updates)
- [ ] Web scraping UI (integrate existing backend endpoints)
- [ ] Modal overlay z-index fix

### P3 (Priority 3)
- [ ] Knowledge base embeddings for semantic search
- [ ] LinkedIn branding helper
- [ ] Multi-agent architecture refactor
- [ ] Backend refactoring (split server.py into routers/services/schemas)
- [ ] Frontend state management (consider Zustand)

## Test Credentials
- Email: pdftest@test.com
- Password: test123

## API Endpoints Summary
- Auth: /api/auth/register, /api/auth/login, /api/auth/me, /api/auth/profile
- Jobs: /api/jobs (CRUD)
- Companies: /api/companies (CRUD)
- Contacts: /api/contacts (CRUD)
- Todos: /api/todos (CRUD)
- Knowledge: /api/knowledge (CRUD)
- Prompts: /api/prompts (CRUD)
- Reminders: /api/reminders (CRUD)
- Targets: /api/targets (CRUD)
- Portals: /api/portals (CRUD)
- **Trash: /api/trash, /api/trash/restore/{type}/{id}, /api/trash/{type}/{id}** (NEW)
- Resume: /api/resume/upload, /api/resume/generate, /api/resume/tailor
- AI: /api/chat/send, /api/ai/parse-job-description, /api/ai/interview-prep
- Analytics: /api/analytics/dashboard
- LLM Config: /api/llm-config
