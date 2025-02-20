# web_server/scheduler/cve_scheduler.py

import os
import logging
import asyncio
from datetime import datetime, timedelta
from contextlib import asynccontextmanager
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorCollection
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from typing import AsyncGenerator, List, Dict
from fastapi import FastAPI
from pymongo import UpdateOne
import yake
import spacy
# import aiohttp

# Load SpaCy NLP model for Named Entity Recognition (NER)
nlp = spacy.load("en_core_web_sm")

logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

# Configuration
MONGO_URL = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("MONGO_DB", "hexalayer")
COLLECTION_NAME = "cves"
RESULTS_PER_PAGE = 2000  # Max allowed by NVD API
NVD_API_URL = "https://services.nvd.nist.gov/rest/json/cves/2.0"

# Initialize MongoDB
mongodb_client = AsyncIOMotorClient(MONGO_URL)
mongodb_collection = mongodb_client[DB_NAME][COLLECTION_NAME]

# Initialize components
session = requests.Session()
retry = Retry(
    total=3,
    backoff_factor=0.3,
    status_forcelist=[429, 500, 502, 503, 504],
)
session.mount("https://", HTTPAdapter(max_retries=retry))


async def run_in_executor(func, *args):
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, func, *args)


@asynccontextmanager
async def cve_scheduler_lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Async context manager for CVE scheduler lifespan management."""
    # Create vector search index if not exists
    await create_vector_index(mongodb_collection)

    # Initial full sync
    # await full_sync(mongodb_collection)

    # Initialize scheduler
    scheduler = AsyncIOScheduler()

    # Job to fetch all CVEs every hour
    scheduler.add_job(
        fetch_and_store_cves,
        "interval",
        seconds=3600,  # Run every hour
        args=[mongodb_collection],
    )

    # # Job to sync CVEs modified in the last week
    # scheduler.add_job(
    #     sync_recent_cve_changes,
    #     "interval",
    #     days=1,  # Run daily to fetch changes from the last week
    #     args=[mongodb_collection],
    # )

    scheduler.start()
    logger.info("CVE Scheduler initialized")
    yield
    scheduler.shutdown()
    mongodb_client.close()
    logger.info("CVE Scheduler shutdown completed")


async def create_vector_index(collection):
    """Create a standard text index if vector search is not supported."""
    index_name = "cve_text_index"
    indexes = await collection.list_indexes().to_list(None)

    if not any(index["name"] == index_name for index in indexes):
        await collection.create_index([("description", "text")], name=index_name)
        logger.info("Created text search index")


async def full_sync(collection):
    """Perform full synchronization of CVEs."""
    logger.info("Starting full synchronization")

    # Define the date range
    start_date = "2023-07-01"  # Mid-2023
    end_date = datetime.now().strftime("%Y-%m-%d")  # Current date

    # Fetch all CVEs in chunks
    await fetch_latest_cves_in_chunks(collection, start_date, end_date)

    logger.info("Completed full sync")


async def fetch_latest_cves_in_chunks(
    collection, start_date: str, end_date: str, interval_days: int = 90
):
    """
    Fetch CVEs from the NVD API in chunks of the specified interval.

    :param collection: MongoDB collection.
    :param start_date: The start date in YYYY-MM-DD format.
    :param end_date: The end date in YYYY-MM-DD format.
    :param interval_days: The interval in days for splitting the date range.
    """
    try:
        start = datetime.strptime(start_date, "%Y-%m-%d")
        end = datetime.strptime(end_date, "%Y-%m-%d")
        current_start = start
        all_cves = []

        while current_start < end:
            current_end = min(current_start + timedelta(days=interval_days), end)
            logger.info(
                f"Fetching CVEs from {current_start.strftime('%Y-%m-%d')} to {current_end.strftime('%Y-%m-%d')}"
            )

            params = {
                "pubStartDate": f"{current_start.strftime('%Y-%m-%d')}T00:00:00.000-05:00",
                "pubEndDate": f"{current_end.strftime('%Y-%m-%d')}T23:59:59.999-05:00",
                "resultsPerPage": RESULTS_PER_PAGE,
            }

            response = session.get(NVD_API_URL, params=params, timeout=30)
            response.raise_for_status()

            data = response.json()
            vulnerabilities = data.get("vulnerabilities", [])
            all_cves.extend(vulnerabilities)

            # Process and store the fetched CVEs in MongoDB
            await process_cve_batch(collection, vulnerabilities)

            # Move to the next interval
            current_start = current_end + timedelta(days=1)

        logger.info(f"Fetched a total of {len(all_cves)} CVEs")

    except Exception as e:
        logger.error(f"Failed to fetch CVEs: {str(e)}", exc_info=True)


async def fetch_and_store_cves(collection):
    """Job function to fetch and store CVEs in MongoDB."""
    try:
        logger.info("Starting CVE update job")

        # Define the date range
        start_date = "2023-07-01"  # Mid-2023
        end_date = datetime.now().strftime("%Y-%m-%d")  # Current date

        # Fetch and process CVEs in chunks
        await fetch_latest_cves_in_chunks(collection, start_date, end_date)

        logger.info("CVE update job completed")

    except Exception as e:
        logger.error(f"Error in CVE update job: {str(e)}", exc_info=True)


async def process_cve_batch(collection: AsyncIOMotorCollection, cves: List[Dict]):
    """
    Process a batch of CVEs and store them in MongoDB using Motor's bulk insert/update capabilities.
    """
    try:
        operations = []
        for cve in cves:
            cve_id = cve["cve"]["id"]
            description = cve["cve"]["descriptions"][0]["value"]

            # Prepare the document
            document = {
                "_id": cve_id,
                "description": description,
                "published": cve["cve"]["published"],
                "lastModified": cve["cve"]["lastModified"],
                "raw_data": cve,
            }

            # Add an upsert operation to the batch
            operations.append(
                UpdateOne(
                    {"_id": cve_id},
                    {"$set": document},
                    upsert=True,
                )
            )

        if operations:
            # Perform the bulk write operation
            result = await collection.bulk_write(operations)
            logger.info(
                f"Bulk operation completed: {result.bulk_api_result}. Processed {len(cves)} CVEs."
            )
        else:
            logger.info("No CVEs to process.")

    except Exception as e:
        logger.error(f"Error processing CVE batch: {str(e)}", exc_info=True)


async def sync_recent_cve_changes(collection: AsyncIOMotorCollection):
    """
    Sync CVEs modified in the last 7 days.
    """
    try:
        logger.info("Starting recent CVE changes sync job")

        # Define the date range for the past week
        now = datetime.now()
        last_week = now - timedelta(days=7)
        last_mod_start_date = last_week.strftime("%Y-%m-%dT00:00:00.000-05:00")
        last_mod_end_date = now.strftime("%Y-%m-%dT23:59:59.999-05:00")

        logger.info(
            f"Fetching CVEs modified between {last_mod_start_date} and {last_mod_end_date}"
        )

        # API parameters for modified CVEs
        params = {
            "lastModStartDate": last_mod_start_date,
            "lastModEndDate": last_mod_end_date,
            "resultsPerPage": RESULTS_PER_PAGE,
        }

        # Fetch data from NVD API
        response = session.get(NVD_API_URL, params=params, timeout=30)
        response.raise_for_status()

        data = response.json()
        vulnerabilities = data.get("vulnerabilities", [])

        # Process and store the fetched CVEs in MongoDB
        await process_cve_batch(collection, vulnerabilities)

        logger.info(
            f"Completed recent CVE changes sync job. Fetched and processed {len(vulnerabilities)} CVEs."
        )

    except Exception as e:
        logger.error(f"Error syncing recent CVE changes: {str(e)}", exc_info=True)


async def fetch_relevant_cve_context(query: str, limit: int = 5) -> str:
    """
    Fetch the top `limit` most relevant CVEs based on the query using text-based search.
    If no results are found, or fewer results are found, include the latest 5 published CVEs.

    :param query: The search query string.
    :param limit: The maximum number of results to fetch.
    :return: A string containing formatted CVE context.
    """
    try:
        # Extract important keywords
        important_keywords = extract_important_keywords(query)

        if not important_keywords:
            logger.warning(f"No important keywords found in query: '{query}'")
            return "No relevant keywords found."

        logger.info(
            f"Performing MongoDB regex search with keywords: {important_keywords}"
        )

        # Build MongoDB query using `$regex` for partial matches (case-insensitive)
        regex_queries = [
            {"cve.description.description_data.value": {"$regex": kw, "$options": "i"}}
            for kw in important_keywords
        ]

        # MongoDB query with `$or` for multi-keyword search
        query_filter = {"$or": regex_queries}

        # Perform MongoDB search
        relevant_results = (
            await mongodb_collection.find(
                query_filter,  # Partial match search
                {
                    "_id": 0,
                    "cve.CVE_data_meta.ID": 1,
                    "cve.description.description_data.value": 1,
                    "publishedDate": 1,
                    "cve.references.reference_data": 1,
                },
            )
            .sort("publishedDate", -1)  # Sort by newest CVEs first
            .limit(limit)
            .to_list(length=limit)
        )

        latest_results = []
        if len(relevant_results) < 2:
            # Fetch the latest 5 published CVEs as a fallback
            latest_results = (
                await mongodb_collection.find(
                    {},  # No query filter to get the latest CVEs
                    {
                        "_id": 0,
                        "cve.CVE_data_meta.ID": 1,
                        "cve.description.description_data.value": 1,
                        "publishedDate": 1,
                        "cve.references.reference_data": 1,
                    },
                )
                .sort("publishedDate", -1)  # Sort by published date in descending order
                .limit(5)
                .to_list(length=5)
            )

        # Deduplicate using CVE IDs
        all_results_dict = {}
        for res in relevant_results + latest_results:
            cve_id = res["cve"]["CVE_data_meta"]["ID"]
            all_results_dict[cve_id] = res  # Overwrite duplicates based on CVE ID

        # Extract combined results and ensure the limit is respected
        combined_results = list(all_results_dict.values())

        # Format the results into a human-readable context string
        context = "\n".join(
            [
                f"- CVE ID: {res['cve']['CVE_data_meta']['ID']}\n"
                f"  Description: {res['cve']['description']['description_data'][0].get('value', 'No description available.')}\n"
                f"  Published Date: {res.get('publishedDate', 'Unknown')}\n"
                f"  References: {', '.join([ref['url'] for ref in res['cve']['references']['reference_data']]) if 'references' in res['cve'] else 'No references available.'}"
                for res in combined_results
            ]
        )

        logger.info(
            f"Successfully fetched {len(combined_results)} CVEs for query: '{query}'"
        )
        return context

    except Exception as e:
        logger.error(
            f"Error fetching CVE context for query '{query}': {str(e)}", exc_info=True
        )
        return "Failed to fetch CVE context due to an internal error."


def extract_important_keywords(query: str, max_keywords: int = 5) -> List[str]:
    """
    Extract only the most important keywords from a query for MongoDB search.

    Uses:
    - YAKE (to extract high-ranking key phrases)
    - Named Entity Recognition (NER) with SpaCy to detect key entities
    """
    # Extract YAKE keywords
    kw_extractor = yake.KeywordExtractor(lan="en", n=3, dedupLim=0.9, top=max_keywords)
    yake_keywords = {kw[0] for kw in kw_extractor.extract_keywords(query)}

    # Extract Named Entities (NER)
    doc = nlp(query)
    named_entities = {
        ent.text
        for ent in doc.ents
        if ent.label_ in {"ORG", "PRODUCT", "GPE", "PERSON"}
    }

    # Merge YAKE + Named Entities
    important_keywords = yake_keywords | named_entities  # Set union (avoids duplicates)

    return list(important_keywords)


# async def fetch_cves_from_api(keyword: str) -> dict:
#     """
#     Fetch CVEs from the NVD API using a keyword search.

#     :param keyword: The keyword to search for CVEs.
#     :return: A dictionary containing the CVE results.
#     """
#     url = f"https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch={keyword}"
    
#     try:
#         async with aiohttp.ClientSession() as session:
#             async with session.get(url) as response:
#                 if response.status == 200:
#                     data = await response.json()
#                     return data.get("vulnerabilities", [])
#                 else:
#                     logger.error(f"Failed to fetch CVEs from API. Status Code: {response.status}")
#                     return []
#     except Exception as e:
#         logger.error(f"Error fetching CVEs from NVD API: {str(e)}", exc_info=True)
#         return []