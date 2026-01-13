import asyncio
import re
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig
import logging

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


async def crawl_url(url: str) -> EmailResult:
    """Crawl a single URL and extract emails"""
    try:
        browser_config = BrowserConfig(
            headless=True,
            verbose=False
        )

        crawl_config = CrawlerRunConfig(
            wait_until="domcontentloaded",
            page_timeout=30000,
        )

        async with AsyncWebCrawler(config=browser_config) as crawler:
            result = await crawler.arun(
                url=url,
                config=crawl_config
            )

            if not result.success:
                return EmailResult(
                    url=url,
                    emails=[],
                    status="error",
                    error=result.error_message or "Failed to crawl"
                )

            # Extract emails from markdown content and raw HTML
            emails_from_markdown = extract_emails_from_text(result.markdown or "")
            emails_from_html = extract_emails_from_text(result.html or "")

            all_emails = list(set(emails_from_markdown + emails_from_html))
            filtered_emails = filter_emails(all_emails)

            return EmailResult(
                url=url,
                emails=filtered_emails,
                status="success"
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
    result = await crawl_url(request.url)

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
    semaphore = asyncio.Semaphore(5)  # Max 5 concurrent crawls

    async def crawl_with_limit(url: str) -> EmailResult:
        async with semaphore:
            return await crawl_url(url)

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
