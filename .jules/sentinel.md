## 2024-05-23 - SSRF Protection Pattern
**Vulnerability:** Scrapers were vulnerable to SSRF (Server-Side Request Forgery), allowing access to internal network resources (e.g., localhost).
**Learning:** The application uses multiple scraper functions that all fetch external URLs. Centralized validation is crucial.
**Prevention:** Use the `validate_url` function in `backend/scrapers.py` before making any external HTTP requests. This function checks for private/loopback IP addresses by resolving the hostname.
