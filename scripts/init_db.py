#!/usr/bin/env python3
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from init_db import init_database

if __name__ == "__main__":
    asyncio.run(init_database())