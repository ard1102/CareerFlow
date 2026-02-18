"""
Web scraping utilities for job portals
- LinkedIn, Indeed, Monster, JobDiva
"""

import re
from typing import List, Dict, Optional
from bs4 import BeautifulSoup
import asyncio
from urllib.parse import urlparse, parse_qs
import socket
import ipaddress

async def validate_url(url: str) -> bool:
    """Validate that URL is safe to scrape (SSRF protection)"""
    try:
        parsed = urlparse(url)
        if parsed.scheme not in ('http', 'https'):
            return False

        hostname = parsed.hostname
        if not hostname:
            return False

        # Run DNS resolution in executor to avoid blocking
        loop = asyncio.get_running_loop()
        try:
            # Use getaddrinfo to handle both IPv4 and IPv6
            addr_info = await loop.run_in_executor(None, socket.getaddrinfo, hostname, None)

            for family, _, _, _, sockaddr in addr_info:
                ip = sockaddr[0]
                ip_obj = ipaddress.ip_address(ip)
                if ip_obj.is_private or ip_obj.is_loopback or ip_obj.is_link_local:
                    return False
        except socket.gaierror:
            return False # Cannot resolve

        return True
    except Exception:
        return False

async def scrape_job_from_url(url: str) -> Dict:
    """
    Scrape job details from a URL
    Detects the job portal and uses appropriate scraper
    """
    # SSRF Protection
    if not await validate_url(url):
         return {
             "error": "Invalid URL",
             "description": "Security check failed: URL points to a restricted network resource or is invalid.",
             "title": "Error",
             "company": None
         }

    domain = urlparse(url).netloc.lower()
    
    if 'linkedin.com' in domain:
        return await scrape_linkedin(url)
    elif 'indeed.com' in domain:
        return await scrape_indeed(url)
    elif 'monster.com' in domain:
        return await scrape_monster(url)
    elif 'jobdiva.com' in domain:
        return await scrape_jobdiva(url)
    else:
        return await scrape_generic(url)

async def scrape_linkedin(url: str) -> Dict:
    """
    Scrape LinkedIn job posting
    Note: LinkedIn requires authentication, this is a basic scraper
    """
    # For MVP, we'll extract from URL patterns and return template
    # Full implementation would need Playwright with authentication
    
    result = {
        "title": None,
        "company": None,
        "location": None,
        "description": None,
        "source": "LinkedIn"
    }
    
    # Try to extract job ID from URL
    job_id_match = re.search(r'/jobs/view/(\d+)', url)
    if job_id_match:
        result["posting_url"] = url
        result["notes"] = f"LinkedIn Job ID: {job_id_match.group(1)}"
    
    # LinkedIn scraping requires authentication
    # For now, return a message
    result["description"] = "LinkedIn scraping requires authentication. Please manually copy job details or use the email parser."
    
    return result

async def scrape_indeed(url: str) -> Dict:
    """
    Scrape Indeed job posting
    """
    import httpx
    
    result = {
        "title": None,
        "company": None,
        "location": None,
        "description": None,
        "pay": None,
        "source": "Indeed",
        "posting_url": url
    }
    
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, headers=headers, follow_redirects=True)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Extract title
                title_elem = soup.find('h1', class_=re.compile('jobsearch-JobInfoHeader'))
                if not title_elem:
                    title_elem = soup.find('h1')
                if title_elem:
                    result["title"] = title_elem.get_text(strip=True)
                
                # Extract company
                company_elem = soup.find('div', {'data-company-name': True})
                if not company_elem:
                    company_elem = soup.find('div', class_=re.compile('company'))
                if company_elem:
                    result["company"] = company_elem.get_text(strip=True)
                
                # Extract location
                location_elem = soup.find('div', {'data-testid': 'job-location'})
                if not location_elem:
                    location_elem = soup.find('div', class_=re.compile('location'))
                if location_elem:
                    result["location"] = location_elem.get_text(strip=True)
                
                # Extract salary
                salary_elem = soup.find('div', class_=re.compile('salary'))
                if not salary_elem:
                    salary_elem = soup.find('span', class_=re.compile('salary'))
                if salary_elem:
                    result["pay"] = salary_elem.get_text(strip=True)
                
                # Extract description
                desc_elem = soup.find('div', id='jobDescriptionText')
                if not desc_elem:
                    desc_elem = soup.find('div', class_=re.compile('jobDescr'))
                if desc_elem:
                    result["description"] = desc_elem.get_text(separator='\n', strip=True)[:2000]
                
    except Exception as e:
        result["description"] = f"Error scraping Indeed: {str(e)}"
    
    return result

async def scrape_monster(url: str) -> Dict:
    """
    Scrape Monster job posting
    """
    import httpx
    
    result = {
        "title": None,
        "company": None,
        "location": None,
        "description": None,
        "pay": None,
        "source": "Monster",
        "posting_url": url
    }
    
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, headers=headers, follow_redirects=True)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Extract title
                title_elem = soup.find('h1', class_=re.compile('job.*title|title'))
                if not title_elem:
                    title_elem = soup.find('h1')
                if title_elem:
                    result["title"] = title_elem.get_text(strip=True)
                
                # Extract company
                company_elem = soup.find('span', class_=re.compile('company'))
                if not company_elem:
                    company_elem = soup.find('div', class_=re.compile('company'))
                if company_elem:
                    result["company"] = company_elem.get_text(strip=True)
                
                # Extract location
                location_elem = soup.find('span', class_=re.compile('location'))
                if not location_elem:
                    location_elem = soup.find('div', class_=re.compile('location'))
                if location_elem:
                    result["location"] = location_elem.get_text(strip=True)
                
                # Extract description
                desc_elem = soup.find('div', class_=re.compile('description|job.*body'))
                if desc_elem:
                    result["description"] = desc_elem.get_text(separator='\n', strip=True)[:2000]
                
    except Exception as e:
        result["description"] = f"Error scraping Monster: {str(e)}"
    
    return result

async def scrape_jobdiva(url: str) -> Dict:
    """
    Scrape JobDiva posting
    """
    import httpx
    
    result = {
        "title": None,
        "company": None,
        "location": None,
        "description": None,
        "source": "JobDiva",
        "posting_url": url
    }
    
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, headers=headers, follow_redirects=True)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # JobDiva has various layouts, try multiple selectors
                title_elem = soup.find('h1') or soup.find('h2', class_=re.compile('title'))
                if title_elem:
                    result["title"] = title_elem.get_text(strip=True)
                
                # Try to find job details in various formats
                details = soup.find_all(['div', 'span', 'p'], class_=re.compile('detail|info'))
                
                for detail in details:
                    text = detail.get_text(strip=True)
                    if 'location' in detail.get('class', []):
                        result["location"] = text
                    elif 'company' in detail.get('class', []):
                        result["company"] = text
                
                # Extract description
                desc_elem = soup.find('div', class_=re.compile('description|content|body'))
                if not desc_elem:
                    desc_elem = soup.find('div', id=re.compile('description|content'))
                if desc_elem:
                    result["description"] = desc_elem.get_text(separator='\n', strip=True)[:2000]
                
    except Exception as e:
        result["description"] = f"Error scraping JobDiva: {str(e)}"
    
    return result

async def scrape_generic(url: str) -> Dict:
    """
    Generic web scraper for unknown job portals
    """
    import httpx
    
    result = {
        "title": None,
        "company": None,
        "location": None,
        "description": None,
        "source": "Generic",
        "posting_url": url
    }
    
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, headers=headers, follow_redirects=True)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Try to extract title from h1 or title tag
                title_elem = soup.find('h1')
                if title_elem:
                    result["title"] = title_elem.get_text(strip=True)
                
                # Try to extract main content
                main_content = soup.find('main') or soup.find('article') or soup.find('div', class_=re.compile('content|main'))
                if main_content:
                    result["description"] = main_content.get_text(separator='\n', strip=True)[:2000]
                
    except Exception as e:
        result["description"] = f"Error scraping URL: {str(e)}"
    
    return result

async def search_jobs(query: str, location: str = "", num_results: int = 10) -> List[Dict]:
    """
    Search for jobs across multiple platforms
    Returns list of job URLs to scrape
    """
    results = []
    
    # Indeed search
    indeed_search_url = f"https://www.indeed.com/jobs?q={query.replace(' ', '+')}&l={location.replace(' ', '+')}"
    results.append({
        "portal": "Indeed",
        "search_url": indeed_search_url,
        "note": "Visit this URL to see job listings, then paste individual job URLs to scrape"
    })
    
    # LinkedIn search
    linkedin_search_url = f"https://www.linkedin.com/jobs/search/?keywords={query.replace(' ', '%20')}&location={location.replace(' ', '%20')}"
    results.append({
        "portal": "LinkedIn",
        "search_url": linkedin_search_url,
        "note": "LinkedIn requires login. Visit URL in browser, then copy job URLs"
    })
    
    # Monster search
    monster_search_url = f"https://www.monster.com/jobs/search?q={query.replace(' ', '-')}&where={location.replace(' ', '-')}"
    results.append({
        "portal": "Monster",
        "search_url": monster_search_url,
        "note": "Visit this URL to see job listings, then paste individual job URLs to scrape"
    })
    
    return results
