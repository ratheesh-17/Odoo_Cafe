#!/usr/bin/env python3
"""
Simple script to run the seed manually (without starting the server).
Usage: python run_seed.py
"""
import sys
from app.database.seed import run_seed

if __name__ == "__main__":
    try:
        run_seed()
        print("\n✅ Seeding completed successfully!")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Seeding failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
