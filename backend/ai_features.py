"""
AI-powered features for CareerFlow
- Job description parsing
- Interview prep suggestions
- Email parsing
- Embeddings for knowledge search
"""

import re
from typing import List, Dict, Optional
from sentence_transformers import SentenceTransformer
import numpy as np

# Initialize embedding model (lightweight)
embedding_model = None

def get_embedding_model():
    global embedding_model
    if embedding_model is None:
        try:
            embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        except Exception as e:
            print(f"Error loading embedding model: {e}")
    return embedding_model

def parse_job_description(description: str) -> Dict:
    """
    Parse job description to extract key information using regex and NLP
    """
    result = {
        "skills": [],
        "requirements": [],
        "qualifications": [],
        "responsibilities": [],
        "experience_years": None,
        "education": [],
        "benefits": []
    }
    
    # Extract years of experience
    exp_match = re.search(r'(\d+)\+?\s*(?:years?|yrs?)(?:\s+of)?\s+experience', description, re.IGNORECASE)
    if exp_match:
        result["experience_years"] = int(exp_match.group(1))
    
    # Common programming languages and technologies
    tech_keywords = [
        'Python', 'Java', 'JavaScript', 'TypeScript', 'React', 'Angular', 'Vue',
        'Node.js', 'Django', 'Flask', 'FastAPI', 'Spring', 'AWS', 'Azure', 'GCP',
        'Docker', 'Kubernetes', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis',
        'Git', 'CI/CD', 'REST API', 'GraphQL', 'Machine Learning', 'AI',
        'TensorFlow', 'PyTorch', 'Pandas', 'NumPy', 'SQL', 'NoSQL',
        'Microservices', 'Agile', 'Scrum', 'HTML', 'CSS', 'Tailwind',
        'Bootstrap', 'Material-UI', 'Redux', 'Next.js', 'Express.js'
    ]
    
    for tech in tech_keywords:
        if re.search(r'\b' + re.escape(tech) + r'\b', description, re.IGNORECASE):
            result["skills"].append(tech)
    
    # Extract requirements (lines starting with bullet points or numbers)
    req_patterns = [
        r'(?:^|\n)\s*[•\-\*]\s*(.+?)(?=\n|$)',
        r'(?:^|\n)\s*\d+\.\s*(.+?)(?=\n|$)'
    ]
    
    for pattern in req_patterns:
        matches = re.findall(pattern, description, re.MULTILINE)
        result["requirements"].extend(matches[:5])  # Limit to 5
    
    # Extract education requirements
    edu_keywords = ["Bachelor", "Master", "PhD", "BS", "MS", "MBA", "degree"]
    for keyword in edu_keywords:
        if re.search(r'\b' + keyword + r'\b', description, re.IGNORECASE):
            edu_match = re.search(r'(.{0,50}' + keyword + r'.{0,50})', description, re.IGNORECASE)
            if edu_match and keyword not in str(result["education"]):
                result["education"].append(edu_match.group(0).strip())
    
    # Extract benefits
    benefit_keywords = ["health insurance", "401k", "dental", "vision", "pto", "paid time off",
                       "remote", "hybrid", "flexible hours", "stock options", "bonus"]
    for benefit in benefit_keywords:
        if re.search(r'\b' + benefit + r'\b', description, re.IGNORECASE):
            result["benefits"].append(benefit.title())
    
    # Remove duplicates
    result["skills"] = list(set(result["skills"]))
    result["requirements"] = list(set(result["requirements"]))
    result["education"] = list(set(result["education"]))
    result["benefits"] = list(set(result["benefits"]))
    
    return result

def generate_interview_questions(job_title: str, description: str, skills: List[str]) -> List[Dict]:
    """
    Generate interview preparation questions based on job details
    """
    questions = []
    
    # Technical questions based on skills
    tech_questions = {
        "Python": "Can you explain the difference between list and tuple in Python? When would you use each?",
        "JavaScript": "What are closures in JavaScript and how do they work?",
        "React": "Explain the React component lifecycle and hooks like useEffect.",
        "AWS": "What is the difference between EC2 and Lambda? When would you use each?",
        "Docker": "How would you optimize a Docker image for production?",
        "SQL": "Explain the difference between INNER JOIN and LEFT JOIN with examples.",
        "MongoDB": "When would you choose MongoDB over a relational database?",
        "REST API": "What are the principles of REST API design?",
        "Machine Learning": "Explain the bias-variance tradeoff in machine learning.",
    }
    
    for skill in skills[:5]:  # Top 5 skills
        if skill in tech_questions:
            questions.append({
                "category": "Technical",
                "skill": skill,
                "question": tech_questions[skill]
            })
    
    # Behavioral questions
    behavioral = [
        {
            "category": "Behavioral",
            "question": "Tell me about a time you faced a challenging problem and how you solved it."
        },
        {
            "category": "Behavioral",
            "question": "Describe a situation where you had to work with a difficult team member."
        },
        {
            "category": "Behavioral",
            "question": "How do you handle tight deadlines and pressure?"
        },
        {
            "category": "Leadership",
            "question": "Give an example of when you led a project or initiative."
        }
    ]
    
    questions.extend(behavioral[:3])
    
    # Role-specific questions
    if "senior" in job_title.lower():
        questions.append({
            "category": "Experience",
            "question": "As a senior engineer, how do you mentor junior team members?"
        })
        questions.append({
            "category": "Architecture",
            "question": "Describe your approach to system design and architecture decisions."
        })
    
    if "manager" in job_title.lower() or "lead" in job_title.lower():
        questions.append({
            "category": "Management",
            "question": "How do you prioritize tasks and manage your team's workload?"
        })
    
    return questions

def parse_email_for_job(email_content: str) -> Dict:
    """
    Parse email content to extract job-related information
    """
    result = {
        "title": None,
        "company": None,
        "location": None,
        "pay": None,
        "posting_url": None,
        "description": email_content[:500]  # First 500 chars
    }
    
    # Extract URLs
    url_pattern = r'https?://[^\s<>"]+'
    urls = re.findall(url_pattern, email_content)
    if urls:
        result["posting_url"] = urls[0]
    
    # Try to extract company name (look for patterns like "at CompanyName" or "with CompanyName")
    company_patterns = [
        r'(?:at|with|for)\s+([A-Z][A-Za-z0-9\s&]+?)(?:\s+(?:is|has|invites))',
        r'(?:join|work for|career at)\s+([A-Z][A-Za-z0-9\s&]+)',
    ]
    
    for pattern in company_patterns:
        match = re.search(pattern, email_content)
        if match:
            result["company"] = match.group(1).strip()
            break
    
    # Extract job title (look for common job titles)
    title_keywords = [
        "Software Engineer", "Senior Engineer", "Full Stack", "Frontend", "Backend",
        "Data Scientist", "Product Manager", "DevOps", "Engineering Manager"
    ]
    
    for title in title_keywords:
        if title.lower() in email_content.lower():
            result["title"] = title
            break
    
    # Extract location
    location_pattern = r'(?:in|at|location:|based in)\s+([A-Z][a-z]+(?:,\s*[A-Z]{2})?)'
    loc_match = re.search(location_pattern, email_content)
    if loc_match:
        result["location"] = loc_match.group(1)
    
    # Extract salary
    salary_patterns = [
        r'\$\s*(\d{1,3}(?:,\d{3})*(?:k|K)?(?:\s*-\s*\$?\s*\d{1,3}(?:,\d{3})*(?:k|K)?)?)',
        r'(\d{1,3}(?:,\d{3})*)\s*-\s*(\d{1,3}(?:,\d{3})*)\s*(?:USD|dollars)',
    ]
    
    for pattern in salary_patterns:
        match = re.search(pattern, email_content)
        if match:
            result["pay"] = match.group(0)
            break
    
    return result

def generate_embeddings(texts: List[str]) -> np.ndarray:
    """
    Generate embeddings for a list of texts
    """
    model = get_embedding_model()
    if model is None:
        return np.array([])
    
    try:
        embeddings = model.encode(texts, convert_to_numpy=True)
        return embeddings
    except Exception as e:
        print(f"Error generating embeddings: {e}")
        return np.array([])

def search_knowledge_by_embedding(query: str, knowledge_items: List[Dict], top_k: int = 5) -> List[Dict]:
    """
    Search knowledge base using semantic similarity
    """
    model = get_embedding_model()
    if model is None or not knowledge_items:
        return []
    
    try:
        # Generate query embedding
        query_embedding = model.encode([query], convert_to_numpy=True)[0]
        
        # Generate embeddings for all knowledge items
        texts = [f"{item['title']} {item['content']}" for item in knowledge_items]
        knowledge_embeddings = model.encode(texts, convert_to_numpy=True)
        
        # Calculate cosine similarity
        similarities = np.dot(knowledge_embeddings, query_embedding) / (
            np.linalg.norm(knowledge_embeddings, axis=1) * np.linalg.norm(query_embedding)
        )
        
        # Get top k results
        top_indices = np.argsort(similarities)[::-1][:top_k]
        
        results = []
        for idx in top_indices:
            if similarities[idx] > 0.3:  # Threshold
                item = knowledge_items[idx].copy()
                item['similarity_score'] = float(similarities[idx])
                results.append(item)
        
        return results
    except Exception as e:
        print(f"Error in semantic search: {e}")
        return []

def extract_learning_path(job_skills: List[str], user_skills: List[str] = None) -> Dict:
    """
    Generate a learning path based on job requirements and user's current skills
    """
    if user_skills is None:
        user_skills = []
    
    missing_skills = [skill for skill in job_skills if skill not in user_skills]
    
    # Skill categories and learning resources
    skill_resources = {
        "Python": {"category": "Programming", "difficulty": "Beginner", "time": "2-3 months"},
        "JavaScript": {"category": "Programming", "difficulty": "Beginner", "time": "2-3 months"},
        "React": {"category": "Frontend", "difficulty": "Intermediate", "time": "1-2 months"},
        "Node.js": {"category": "Backend", "difficulty": "Intermediate", "time": "1-2 months"},
        "AWS": {"category": "Cloud", "difficulty": "Intermediate", "time": "2-3 months"},
        "Docker": {"category": "DevOps", "difficulty": "Intermediate", "time": "1 month"},
        "MongoDB": {"category": "Database", "difficulty": "Beginner", "time": "1 month"},
        "Machine Learning": {"category": "AI/ML", "difficulty": "Advanced", "time": "3-6 months"},
    }
    
    learning_path = []
    for skill in missing_skills[:10]:  # Top 10 missing skills
        if skill in skill_resources:
            learning_path.append({
                "skill": skill,
                **skill_resources[skill]
            })
    
    return {
        "missing_skills": missing_skills,
        "learning_path": learning_path,
        "estimated_time": f"{len(learning_path) * 2}-{len(learning_path) * 4} months"
    }
