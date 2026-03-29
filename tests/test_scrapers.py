import pytest
import sys
import os
import socket
import asyncio
from unittest.mock import patch, MagicMock

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from scrapers import validate_url, scrape_job_from_url

@pytest.mark.asyncio
async def test_validate_url_internal():
    # Mock getaddrinfo to return 127.0.0.1
    with patch('socket.getaddrinfo') as mock_getaddrinfo:
        # getaddrinfo return format: list of (family, type, proto, canonname, sockaddr)
        # sockaddr for IPv4 is (address, port)
        mock_getaddrinfo.return_value = [
            (socket.AF_INET, socket.SOCK_STREAM, 6, '', ('127.0.0.1', 80))
        ]

        result = await validate_url("http://localhost")
        assert result is False

@pytest.mark.asyncio
async def test_validate_url_external():
    # Mock getaddrinfo to return 8.8.8.8 (Google DNS IP - definitely public)
    with patch('socket.getaddrinfo') as mock_getaddrinfo:
        mock_getaddrinfo.return_value = [
            (socket.AF_INET, socket.SOCK_STREAM, 6, '', ('8.8.8.8', 80))
        ]

        result = await validate_url("http://google.com")
        assert result is True

@pytest.mark.asyncio
async def test_validate_url_private_range():
    # Mock getaddrinfo to return 192.168.1.1
    with patch('socket.getaddrinfo') as mock_getaddrinfo:
        mock_getaddrinfo.return_value = [
            (socket.AF_INET, socket.SOCK_STREAM, 6, '', ('192.168.1.1', 80))
        ]

        result = await validate_url("http://intranet.local")
        assert result is False

@pytest.mark.asyncio
async def test_scrape_job_blocks_internal():
    # Test that scrape_job_from_url calls validate_url and returns error
    with patch('scrapers.validate_url') as mock_validate:
        mock_validate.return_value = False

        result = await scrape_job_from_url("http://internal-service")

        assert "error" in result
        assert result["error"] == "Invalid URL"
        assert "Security check failed" in result["description"]
