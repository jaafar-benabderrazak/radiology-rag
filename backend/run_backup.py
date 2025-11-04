#!/usr/bin/env python3
"""
Scheduled Backup Script
Can be run via cron or as a standalone script
"""
import sys
import logging
from datetime import datetime
from backup_service import backup_service

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/app/logs/backup.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

def main():
    """Run scheduled backup"""
    logger.info("=" * 70)
    logger.info("Starting scheduled backup")
    logger.info(f"Timestamp: {datetime.now().isoformat()}")
    logger.info("=" * 70)

    try:
        # Create backup
        result = backup_service.create_full_backup()

        if result.get("success"):
            logger.info("✅ Backup completed successfully")
            logger.info(f"Backup name: {result['backup_name']}")
            logger.info(f"Size: {result['size_mb']} MB")
            logger.info(f"Archive: {result['archive_path']}")
            return 0
        else:
            logger.error(f"❌ Backup failed: {result.get('error', 'Unknown error')}")
            return 1

    except Exception as e:
        logger.error(f"❌ Backup failed with exception: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
