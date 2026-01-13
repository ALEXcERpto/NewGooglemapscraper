import asyncio
import re
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import logging
import aiohttp

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Email Extraction Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Email regex pattern
EMAIL_PATTERN = re.compile(
    r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
)

# Common false positive patterns to filter out
FALSE_POSITIVE_PATTERNS = [
    r'.*@example\.com$',
    r'.*@test\.com$',
    r'.*@placeholder\.com$',
    r'.*\.png$',
    r'.*\.jpg$',
    r'.*\.gif$',
    r'.*\.svg$',
    r'.*@\d+x\..*$',
    r'.*@sentry.*$',
    r'.*wixpress\.com$',
]


class ExtractRequest(BaseModel):
    url: str
    include_subpages: bool = False


class ExtractBatchRequest(BaseModel):
    urls: List[str]


class EmailResult(BaseModel):
    url: str
    emails: List[str]
    status: str
    error: Optional[str] = None


class ExtractResponse(BaseModel):
    success: bool
    results: List[EmailResult]
    total_emails: int
    unique_emails: List[str]


def filter_emails(emails: List[str]) -> List[str]:
    """Filter out false positive emails"""
    filtered = []
    for email in emails:
        email_lower = email.lower()
        is_false_positive = any(
            re.match(pattern, email_lower)
            for pattern in FALSE_POSITIVE_PATTERNS
        )
        if not is_false_positive and email_lower not in [e.lower() for e in filtered]:
            filtered.append(email)
    return filtered


def extract_emails_from_text(text: str) -> List[str]:
    """Extract emails from text using regex"""
    if not text:
        return []
    matches = EMAIL_PATTERN.findall(text)
    return filter_emails(list(set(matches)))


async def crawl_url_simple(url: str) -> EmailResult:
    """Crawl a single URL using simple HTTP request and extract emails"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
        
        timeout = aiohttp.ClientTimeout(total=30)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.get(url, headers=headers, ssl=False) as response:
                if response.status != 200:
                    return EmailResult(
                        url=url,
                        emails=[],
                        status="error",
                        error=f"HTTP {response.status}"
                    )
                
                html = await response.text()
                emails = extract_emails_from_text(html)
                
                return EmailResult(
                    url=url,
                    emails=emails,
                    status="success"
                )
                
    except asyncio.TimeoutError:
        return EmailResult(
            url=url,
            emails=[],
            status="error",
            error="Request timeout"
        )
    except Exception as e:
        logger.error(f"Error crawling {url}: {str(e)}")
        return EmailResult(
            url=url,
            emails=[],
            status="error",
            error=str(e)
        )


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "email-extraction"}


@app.post("/extract", response_model=ExtractResponse)
async def extract_emails(request: ExtractRequest):
    """Extract emails from a single URL"""
    result = await crawl_url_simple(request.url)

    return ExtractResponse(
        success=result.status == "success",
        results=[result],
        total_emails=len(result.emails),
        unique_emails=result.emails
    )


@app.post("/extract/batch", response_model=ExtractResponse)
async def extract_emails_batch(request: ExtractBatchRequest):
    """Extract emails from multiple URLs in parallel"""
    if len(request.urls) > 50:
        raise HTTPException(
            status_code=400,
            detail="Maximum 50 URLs per batch request"
        )

    # Process URLs in parallel with concurrency limit
    semaphore = asyncio.Semaphore(10)  # Max 10 concurrent requests

    async def crawl_with_limit(url: str) -> EmailResult:
        async with semaphore:
            return await crawl_url_simple(url)

    tasks = [crawl_with_limit(url) for url in request.urls]
    results = await asyncio.gather(*tasks)

    # Aggregate unique emails
    all_emails = []
    for result in results:
        all_emails.extend(result.emails)
    unique_emails = filter_emails(all_emails)

    successful = sum(1 for r in results if r.status == "success")

    return ExtractResponse(
        success=successful > 0,
        results=list(results),
        total_emails=len(all_emails),
        unique_emails=unique_emails
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
