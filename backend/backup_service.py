"""
Backup & Disaster Recovery Service
Automated backup system for PostgreSQL database and application data
"""
import os
import subprocess
import shutil
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict, Optional
import logging
import tarfile
import json

logger = logging.getLogger(__name__)

class BackupService:
    """Service for creating and managing backups"""

    def __init__(self):
        # Backup configuration from environment
        self.backup_enabled = os.getenv("BACKUP_ENABLED", "true").lower() == "true"
        self.backup_dir = Path(os.getenv("BACKUP_DIR", "/app/backups"))
        self.retention_days = int(os.getenv("BACKUP_RETENTION_DAYS", "30"))
        self.max_backups = int(os.getenv("MAX_BACKUPS", "50"))

        # Database configuration
        self.db_host = os.getenv("DB_HOST", "postgres")
        self.db_port = os.getenv("DB_PORT", "5432")
        self.db_name = os.getenv("DB_NAME", "radiology_db")
        self.db_user = os.getenv("DB_USER", "postgres")
        self.db_password = os.getenv("DB_PASSWORD", "postgres")

        # Remote backup (optional)
        self.remote_backup_enabled = os.getenv("REMOTE_BACKUP_ENABLED", "false").lower() == "true"
        self.remote_backup_path = os.getenv("REMOTE_BACKUP_PATH", "")

        # Ensure backup directory exists
        self.backup_dir.mkdir(parents=True, exist_ok=True)

        # Backup metadata file
        self.metadata_file = self.backup_dir / "backup_metadata.json"

    def create_full_backup(self) -> Dict[str, any]:
        """
        Create a full system backup including database and application data

        Returns:
            Dictionary with backup information
        """
        if not self.backup_enabled:
            logger.info("Backups are disabled")
            return {"success": False, "error": "Backups disabled"}

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_name = f"radiology_backup_{timestamp}"
        backup_path = self.backup_dir / backup_name
        backup_path.mkdir(parents=True, exist_ok=True)

        logger.info(f"Starting full backup: {backup_name}")

        try:
            # 1. Backup PostgreSQL database
            db_backup_result = self._backup_database(backup_path, timestamp)

            # 2. Backup application configuration
            config_backup_result = self._backup_configuration(backup_path)

            # 3. Backup templates and documents (if any)
            files_backup_result = self._backup_files(backup_path)

            # 4. Create backup metadata
            metadata = {
                "backup_name": backup_name,
                "timestamp": timestamp,
                "datetime": datetime.now().isoformat(),
                "database": db_backup_result,
                "configuration": config_backup_result,
                "files": files_backup_result,
                "backup_size_mb": self._get_directory_size(backup_path)
            }

            # Save metadata
            metadata_path = backup_path / "backup_metadata.json"
            with open(metadata_path, 'w') as f:
                json.dump(metadata, f, indent=2)

            # 5. Compress backup
            archive_path = self._compress_backup(backup_path, backup_name)

            # 6. Remove uncompressed backup
            shutil.rmtree(backup_path)

            # 7. Update backup registry
            self._update_backup_registry(metadata, archive_path)

            # 8. Clean old backups
            self._cleanup_old_backups()

            # 9. Copy to remote location (if configured)
            if self.remote_backup_enabled and self.remote_backup_path:
                self._copy_to_remote(archive_path)

            logger.info(f"✓ Backup completed successfully: {backup_name}")

            return {
                "success": True,
                "backup_name": backup_name,
                "archive_path": str(archive_path),
                "size_mb": metadata["backup_size_mb"],
                "metadata": metadata
            }

        except Exception as e:
            logger.error(f"Backup failed: {e}")
            # Clean up failed backup
            if backup_path.exists():
                shutil.rmtree(backup_path)
            return {
                "success": False,
                "error": str(e)
            }

    def _backup_database(self, backup_path: Path, timestamp: str) -> Dict[str, any]:
        """Backup PostgreSQL database using pg_dump"""
        db_backup_file = backup_path / f"database_{timestamp}.sql"

        logger.info("Backing up PostgreSQL database...")

        try:
            # Set password in environment for pg_dump
            env = os.environ.copy()
            env['PGPASSWORD'] = self.db_password

            # Run pg_dump
            cmd = [
                'pg_dump',
                '-h', self.db_host,
                '-p', self.db_port,
                '-U', self.db_user,
                '-d', self.db_name,
                '-F', 'p',  # Plain SQL format
                '-f', str(db_backup_file),
                '--no-owner',
                '--no-acl'
            ]

            result = subprocess.run(
                cmd,
                env=env,
                capture_output=True,
                text=True,
                timeout=300  # 5 minute timeout
            )

            if result.returncode != 0:
                raise Exception(f"pg_dump failed: {result.stderr}")

            # Get backup size
            size_mb = db_backup_file.stat().st_size / (1024 * 1024)

            logger.info(f"✓ Database backed up successfully ({size_mb:.2f} MB)")

            return {
                "success": True,
                "file": db_backup_file.name,
                "size_mb": round(size_mb, 2)
            }

        except subprocess.TimeoutExpired:
            logger.error("Database backup timed out")
            return {"success": False, "error": "Timeout"}
        except Exception as e:
            logger.error(f"Database backup failed: {e}")
            return {"success": False, "error": str(e)}

    def _backup_configuration(self, backup_path: Path) -> Dict[str, any]:
        """Backup configuration files"""
        config_dir = backup_path / "config"
        config_dir.mkdir(exist_ok=True)

        logger.info("Backing up configuration files...")

        try:
            files_backed_up = []

            # Files to backup (if they exist)
            config_files = [
                '.env.example',
                'docker-compose.yml',
                'docker-compose.local.yml',
                'requirements.txt',
                'backend/config.py'
            ]

            for file_path in config_files:
                src = Path('/app') / file_path
                if src.exists():
                    dest = config_dir / file_path
                    dest.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(src, dest)
                    files_backed_up.append(file_path)

            logger.info(f"✓ Configuration backed up ({len(files_backed_up)} files)")

            return {
                "success": True,
                "files_count": len(files_backed_up),
                "files": files_backed_up
            }

        except Exception as e:
            logger.error(f"Configuration backup failed: {e}")
            return {"success": False, "error": str(e)}

    def _backup_files(self, backup_path: Path) -> Dict[str, any]:
        """Backup uploaded files and templates"""
        files_dir = backup_path / "files"
        files_dir.mkdir(exist_ok=True)

        logger.info("Backing up application files...")

        try:
            files_backed_up = []

            # Directories to backup
            dirs_to_backup = [
                ('/app/backend/templates', 'templates'),
                ('/app/uploads', 'uploads')  # If you have user uploads
            ]

            for src_path, dest_name in dirs_to_backup:
                src = Path(src_path)
                if src.exists() and src.is_dir():
                    dest = files_dir / dest_name
                    shutil.copytree(src, dest, dirs_exist_ok=True)
                    files_backed_up.append(dest_name)

            logger.info(f"✓ Files backed up ({len(files_backed_up)} directories)")

            return {
                "success": True,
                "directories_count": len(files_backed_up),
                "directories": files_backed_up
            }

        except Exception as e:
            logger.error(f"Files backup failed: {e}")
            return {"success": False, "error": str(e)}

    def _compress_backup(self, backup_path: Path, backup_name: str) -> Path:
        """Compress backup directory to tar.gz"""
        archive_path = self.backup_dir / f"{backup_name}.tar.gz"

        logger.info(f"Compressing backup to {archive_path.name}...")

        with tarfile.open(archive_path, "w:gz") as tar:
            tar.add(backup_path, arcname=backup_name)

        size_mb = archive_path.stat().st_size / (1024 * 1024)
        logger.info(f"✓ Backup compressed ({size_mb:.2f} MB)")

        return archive_path

    def _get_directory_size(self, path: Path) -> float:
        """Get total size of directory in MB"""
        total = 0
        for entry in path.rglob('*'):
            if entry.is_file():
                total += entry.stat().st_size
        return round(total / (1024 * 1024), 2)

    def _update_backup_registry(self, metadata: Dict, archive_path: Path):
        """Update backup registry with new backup info"""
        registry = []

        # Load existing registry
        if self.metadata_file.exists():
            with open(self.metadata_file, 'r') as f:
                registry = json.load(f)

        # Add new backup
        registry.append({
            "backup_name": metadata["backup_name"],
            "timestamp": metadata["timestamp"],
            "datetime": metadata["datetime"],
            "archive_path": str(archive_path),
            "size_mb": metadata["backup_size_mb"],
            "database_size_mb": metadata["database"].get("size_mb", 0)
        })

        # Sort by timestamp (newest first)
        registry.sort(key=lambda x: x["timestamp"], reverse=True)

        # Save registry
        with open(self.metadata_file, 'w') as f:
            json.dump(registry, f, indent=2)

    def _cleanup_old_backups(self):
        """Remove old backups based on retention policy"""
        logger.info("Cleaning up old backups...")

        if not self.metadata_file.exists():
            return

        with open(self.metadata_file, 'r') as f:
            registry = json.load(f)

        # Sort by timestamp
        registry.sort(key=lambda x: x["timestamp"], reverse=True)

        # Get cutoff date
        cutoff_date = datetime.now() - timedelta(days=self.retention_days)

        backups_removed = 0
        new_registry = []

        for i, backup in enumerate(registry):
            backup_date = datetime.strptime(backup["timestamp"], "%Y%m%d_%H%M%S")
            archive_path = Path(backup["archive_path"])

            # Keep if: within retention period AND within max backups limit
            if backup_date >= cutoff_date and i < self.max_backups:
                new_registry.append(backup)
            else:
                # Remove old backup
                if archive_path.exists():
                    archive_path.unlink()
                    backups_removed += 1
                    logger.info(f"Removed old backup: {backup['backup_name']}")

        # Save updated registry
        with open(self.metadata_file, 'w') as f:
            json.dump(new_registry, f, indent=2)

        if backups_removed > 0:
            logger.info(f"✓ Cleaned up {backups_removed} old backups")

    def _copy_to_remote(self, archive_path: Path):
        """Copy backup to remote location (NFS, S3, etc.)"""
        logger.info(f"Copying backup to remote location: {self.remote_backup_path}")

        try:
            remote_path = Path(self.remote_backup_path) / archive_path.name
            shutil.copy2(archive_path, remote_path)
            logger.info(f"✓ Backup copied to remote location")
        except Exception as e:
            logger.error(f"Failed to copy to remote: {e}")

    def list_backups(self) -> List[Dict]:
        """List all available backups"""
        if not self.metadata_file.exists():
            return []

        with open(self.metadata_file, 'r') as f:
            return json.load(f)

    def get_backup_info(self, backup_name: str) -> Optional[Dict]:
        """Get information about a specific backup"""
        backups = self.list_backups()
        for backup in backups:
            if backup["backup_name"] == backup_name:
                return backup
        return None

    def delete_backup(self, backup_name: str) -> bool:
        """Delete a specific backup"""
        backup_info = self.get_backup_info(backup_name)
        if not backup_info:
            return False

        try:
            # Delete archive
            archive_path = Path(backup_info["archive_path"])
            if archive_path.exists():
                archive_path.unlink()

            # Update registry
            backups = self.list_backups()
            backups = [b for b in backups if b["backup_name"] != backup_name]

            with open(self.metadata_file, 'w') as f:
                json.dump(backups, f, indent=2)

            logger.info(f"✓ Deleted backup: {backup_name}")
            return True

        except Exception as e:
            logger.error(f"Failed to delete backup: {e}")
            return False

# Singleton instance
backup_service = BackupService()
