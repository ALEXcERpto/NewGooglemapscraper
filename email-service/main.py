import asyncio
import re
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import logging
import os
from dotenv import load_dotenv
from zenrows import ZenRowsClient

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# ZenRows configuration
ZENROWS_API_KEY = os.getenv("ZENROWS_API_KEY")
ZENROWS_CONCURRENCY = int(os.getenv("ZENROWS_CONCURRENCY", "5"))
ZENROWS_RETRIES = int(os.getenv("ZENROWS_RETRIES", "1"))

# Global ZenRows client
zenrows_client = None

app = FastAPI(title="Email Extraction Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    global zenrows_client
    if not ZENROWS_API_KEY:
        logger.error("ZENROWS_API_KEY environment variable is not set!")
        raise RuntimeError("ZENROWS_API_KEY is required")

    zenrows_client = ZenRowsClient(
        ZENROWS_API_KEY,
        concurrency=ZENROWS_CONCURRENCY,
        retries=ZENROWS_RETRIES
    )
    logger.info(f"ZenRows client initialized (concurrency: {ZENROWS_CONCURRENCY})")

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


async def crawl_url_zenrows(url: str) -> EmailResult:
    """Crawl a single URL using ZenRows API and extract emails"""
    try:
        logger.info(f"Crawling {url} with ZenRows")

        # ZenRows parameters - enable JavaScript rendering for dynamic sites
        params = {
            "js_render": "true",
        }

        # Make async request to ZenRows
        response = await zenrows_client.get_async(url, params=params)

        if response.status_code != 200:
            logger.warning(f"ZenRows returned status {response.status_code} for {url}")
            return EmailResult(
                url=url,
                emails=[],
                status="error",
                error=f"HTTP {response.status_code}"
            )

        # Extract emails from the HTML content
        html = response.text
        emails = extract_emails_from_text(html)

        logger.info(f"Successfully extracted {len(emails)} emails from {url}")
        return EmailResult(
            url=url,
            emails=emails,
            status="success"
        )

    except asyncio.TimeoutError:
        logger.error(f"Timeout while crawling {url}")
        return EmailResult(
            url=url,
            emails=[],
            status="error",
            error="Request timeout"
        )
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Error crawling {url} with ZenRows: {error_msg}")

        # Handle specific ZenRows errors
        if "429" in error_msg or "Too Many Requests" in error_msg:
            return EmailResult(
                url=url,
                emails=[],
                status="error",
                error="Rate limit exceeded"
            )
        elif "401" in error_msg or "403" in error_msg:
            return EmailResult(
                url=url,
                emails=[],
                status="error",
                error="API authentication failed - check API key"
            )
        else:
            return EmailResult(
                url=url,
                emails=[],
                status="error",
                error=error_msg
            )


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "email-extraction"}


@app.post("/extract", response_model=ExtractResponse)
async def extract_emails(request: ExtractRequest):
    """Extract emails from a single URL"""
    result = await crawl_url_zenrows(request.url)

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

    # ZenRows SDK handles concurrency internally - no need for manual semaphore
    tasks = [crawl_url_zenrows(url) for url in request.urls]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    # Handle any exceptions during processing
    processed_results = []
    for i, result in enumerate(results):
        if isinstance(result, Exception):
            logger.error(f"Exception processing URL {request.urls[i]}: {str(result)}")
            processed_results.append(EmailResult(
                url=request.urls[i],
                emails=[],
                status="error",
                error=str(result)
            ))
        else:
            processed_results.append(result)

    # Aggregate unique emails
    all_emails = []
    for result in processed_results:
        all_emails.extend(result.emails)
    unique_emails = filter_emails(all_emails)

    successful = sum(1 for r in processed_results if r.status == "success")

    logger.info(f"Batch complete - Success: {successful}/{len(request.urls)}, Emails: {len(unique_emails)}")

    return ExtractResponse(
        success=successful > 0,
        results=list(processed_results),
        total_emails=len(all_emails),
        unique_emails=unique_emails
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
