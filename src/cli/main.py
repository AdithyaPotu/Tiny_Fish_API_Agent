import sys
import argparse
import asyncio
from tinyfish import TinyFish, BrowserProfile, ProxyConfig, ProxyCountryCode
import json
import os
from dotenv import load_dotenv

load_dotenv()

client = TinyFish()


def parse_goal(goal: str) -> str:
    # Enhance goal text into multi‑step plan (simple sketch)
    return f"""
1. Navigate to the target page.
2. {goal}.
3. Return results as a JSON object.
"""


async def run_single(url: str, goal: str, stealth: bool) -> dict:
    browser_profile = BrowserProfile.STEALTH if stealth else BrowserProfile.LITE
    proxy_config = ProxyConfig(enabled=True, country_code=ProxyCountryCode.US) if stealth else None

    enriched_goal = parse_goal(goal)

    events = []
    final_result = None

    async with client.agent.stream(
        url=url,
        goal=enriched_goal,
        browser_profile=browser_profile,
        proxy_config=proxy_config,
    ) as stream:
        async for event in stream:
            events.append(str(event))
            if hasattr(event, "status") and event.status == "completed":
                final_result = getattr(event, "result_json", None)

    return {
        "status": "success" if final_result else "failed",
        "data": final_result or None,
        "screenshots": [],
        "logs": events,
    }


def main():
    parser = argparse.ArgumentParser(
        description="Web Runtime Agent (TinyFish) - Python CLI"
    )
    parser.add_argument(
        "--urls",
        type=str,
        required=True,
        help="Space‑delimited URLs: 'https://site1.com https://site2.com'",
    )
    parser.add_argument(
        "--goal",
        type=str,
        required=True,
        help="Natural‑language goal, e.g., 'Extract products under $100'",
    )
    parser.add_argument(
        "--stealth",
        action="store_true",
        help="Enable stealth / anti‑detection mode",
    )
    parser.add_argument(
        "--parallel",
        action="store_true",
        help="Run sites in parallel",
    )

    args = parser.parse_args()

    urls = [u.strip() for u in args.urls.split() if u.strip()]

    async def run():
        if args.parallel:
            tasks = [run_single(u, args.goal, args.stealth) for u in urls]
            results = await asyncio.gather(*tasks)
        else:
            results = []
            for u in urls:
                res = await run_single(u, args.goal, args.stealth)
                results.append(res)

        final = {
            "status": next(
                (r["status"] for r in results if r["status"] == "failed"),
                "success",
            ),
            "data": [r["data"] for r in results],
            "screenshots": [],
            "logs": [],  # simplify for demo
        }

        print(json.dumps(final, indent=2))

    asyncio.run(run())


if __name__ == "__main__":
    sys.exit(main())
