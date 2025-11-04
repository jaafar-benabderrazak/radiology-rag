"""
Restore Service for Disaster Recovery
Restores database and application data from backups
"""
import os
import subprocess
import shutil
import tarfile
from pathlib import Path
from typing import Dict, Optional
import logging
import json

logger = logging.getLogger(__name__)

class RestoreService:
    """Service for restoring from backups"""

    def __init__(self):
        self.backup_dir = Path(os.getenv("BACKUP_DIR", "/app/backups"))

        # Database configuration
        self.db_host = os.getenv("DB_HOST", "postgres")
        self.db_port = os.getenv("DB_PORT", "5432")
        self.db_name = os.getenv("DB_NAME", "radiology_db")
        self.db_user = os.getenv("DB_USER", "postgres")
        self.db_password = os.getenv("DB_PASSWORD", "postgres")

        # Temporary restore directory
        self.restore_temp_dir = self.backup_dir / "restore_temp"

    def restore_from_backup(self, backup_name: str, restore_options: Dict[str, bool] = None) -> Dict[str, any]:
        """
        Restore system from a backup

        Args:
            backup_name: Name of the backup to restore
            restore_options: Dict with options:
                - restore_database: bool (default True)
                - restore_config: bool (default True)
                - restore_files: bool (default True)

        Returns:
            Dictionary with restore results
        """
        if restore_options is None:
            restore_options = {
                "restore_database": True,
                "restore_config": True,
                "restore_files": True
            }

        logger.info(f"Starting restore from backup: {backup_name}")

        try:
            # 1. Find and extract backup archive
            archive_path = self.backup_dir / f"{backup_name}.tar.gz"
            if not archive_path.exists():
                raise FileNotFoundError(f"Backup archive not found: {archive_path}")

            # 2. Extract backup
            extract_path = self._extract_backup(archive_path, backup_name)

            # Load backup metadata
            metadata_path = extract_path / "backup_metadata.json"
            if not metadata_path.exists():
                raise FileNotFoundError("Backup metadata not found")

            with open(metadata_path, 'r') as f:
                backup_metadata = json.load(f)

            results = {
                "backup_name": backup_name,
                "backup_date": backup_metadata.get("datetime"),
                "operations": {}
            }

            # 3. Restore database
            if restore_options.get("restore_database", True):
                logger.info("Restoring database...")
                db_result = self._restore_database(extract_path, backup_metadata)
                results["operations"]["database"] = db_result
            else:
                results["operations"]["database"] = {"skipped": True}

            # 4. Restore configuration
            if restore_options.get("restore_config", True):
                logger.info("Restoring configuration...")
                config_result = self._restore_configuration(extract_path)
                results["operations"]["configuration"] = config_result
            else:
                results["operations"]["configuration"] = {"skipped": True}

            # 5. Restore files
            if restore_options.get("restore_files", True):
                logger.info("Restoring files...")
                files_result = self._restore_files(extract_path)
                results["operations"]["files"] = files_result
            else:
                results["operations"]["files"] = {"skipped": True}

            # 6. Clean up temporary files
            self._cleanup_temp_files(extract_path)

            logger.info("✓ Restore completed successfully")

            results["success"] = True
            return results

        except Exception as e:
            logger.error(f"Restore failed: {e}")
            # Clean up on failure
            if hasattr(self, 'restore_temp_dir') and self.restore_temp_dir.exists():
                shutil.rmtree(self.restore_temp_dir, ignore_errors=True)
            return {
                "success": False,
                "error": str(e)
            }

    def _extract_backup(self, archive_path: Path, backup_name: str) -> Path:
        """Extract backup archive to temporary directory"""
        logger.info(f"Extracting backup archive...")

        # Create temp directory
        self.restore_temp_dir.mkdir(parents=True, exist_ok=True)

        # Extract archive
        with tarfile.open(archive_path, "r:gz") as tar:
            tar.extractall(self.restore_temp_dir)

        extract_path = self.restore_temp_dir / backup_name

        if not extract_path.exists():
            raise FileNotFoundError("Extracted backup directory not found")

        logger.info(f"✓ Backup extracted to {extract_path}")
        return extract_path

    def _restore_database(self, extract_path: Path, backup_metadata: Dict) -> Dict[str, any]:
        """Restore PostgreSQL database from SQL dump"""
        try:
            # Find database backup file
            db_file = None
            for file in extract_path.glob("database_*.sql"):
                db_file = file
                break

            if not db_file:
                return {"success": False, "error": "Database backup file not found"}

            logger.info(f"Restoring database from {db_file.name}...")

            # Set password in environment
            env = os.environ.copy()
            env['PGPASSWORD'] = self.db_password

            # Drop existing connections and recreate database
            self._prepare_database_for_restore(env)

            # Restore using psql
            cmd = [
                'psql',
                '-h', self.db_host,
                '-p', self.db_port,
                '-U', self.db_user,
                '-d', self.db_name,
                '-f', str(db_file),
                '-v', 'ON_ERROR_STOP=1'
            ]

            result = subprocess.run(
                cmd,
                env=env,
                capture_output=True,
                text=True,
                timeout=600  # 10 minute timeout
            )

            if result.returncode != 0:
                raise Exception(f"psql restore failed: {result.stderr}")

            logger.info("✓ Database restored successfully")

            return {
                "success": True,
                "file": db_file.name,
                "size_mb": backup_metadata.get("database", {}).get("size_mb", 0)
            }

        except subprocess.TimeoutExpired:
            logger.error("Database restore timed out")
            return {"success": False, "error": "Timeout"}
        except Exception as e:
            logger.error(f"Database restore failed: {e}")
            return {"success": False, "error": str(e)}

    def _prepare_database_for_restore(self, env: Dict):
        """Prepare database for restore by dropping all tables"""
        logger.info("Preparing database for restore...")

        try:
            # Drop all tables (CASCADE)
            drop_cmd = [
                'psql',
                '-h', self.db_host,
                '-p', self.db_port,
                '-U', self.db_user,
                '-d', self.db_name,
                '-c', 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;'
            ]

            subprocess.run(drop_cmd, env=env, capture_output=True, check=True, timeout=30)
            logger.info("✓ Database prepared for restore")

        except Exception as e:
            logger.warning(f"Could not prepare database: {e}")

    def _restore_configuration(self, extract_path: Path) -> Dict[str, any]:
        """Restore configuration files"""
        config_dir = extract_path / "config"

        if not config_dir.exists():
            return {"success": False, "error": "Configuration backup not found"}

        try:
            files_restored = []

            # Restore config files
            for config_file in config_dir.rglob('*'):
                if config_file.is_file():
                    relative_path = config_file.relative_to(config_dir)
                    dest = Path('/app') / relative_path

                    # Create parent directories
                    dest.parent.mkdir(parents=True, exist_ok=True)

                    # Copy file (but don't overwrite .env with sensitive data)
                    if dest.name != '.env':
                        shutil.copy2(config_file, dest)
                        files_restored.append(str(relative_path))

            logger.info(f"✓ Configuration restored ({len(files_restored)} files)")

            return {
                "success": True,
                "files_count": len(files_restored),
                "files": files_restored
            }

        except Exception as e:
            logger.error(f"Configuration restore failed: {e}")
            return {"success": False, "error": str(e)}

    def _restore_files(self, extract_path: Path) -> Dict[str, any]:
        """Restore uploaded files and templates"""
        files_dir = extract_path / "files"

        if not files_dir.exists():
            return {"success": False, "error": "Files backup not found"}

        try:
            dirs_restored = []

            # Restore directories
            for backup_dir in files_dir.iterdir():
                if backup_dir.is_dir():
                    dest_path = Path(f'/app/backend/{backup_dir.name}')

                    # Remove existing directory
                    if dest_path.exists():
                        shutil.rmtree(dest_path)

                    # Copy directory
                    shutil.copytree(backup_dir, dest_path)
                    dirs_restored.append(backup_dir.name)

            logger.info(f"✓ Files restored ({len(dirs_restored)} directories)")

            return {
                "success": True,
                "directories_count": len(dirs_restored),
                "directories": dirs_restored
            }

        except Exception as e:
            logger.error(f"Files restore failed: {e}")
            return {"success": False, "error": str(e)}

    def _cleanup_temp_files(self, extract_path: Path):
        """Clean up temporary restore files"""
        try:
            if extract_path.exists():
                shutil.rmtree(extract_path)
            logger.info("✓ Temporary files cleaned up")
        except Exception as e:
            logger.warning(f"Could not clean up temp files: {e}")

    def verify_backup(self, backup_name: str) -> Dict[str, any]:
        """
        Verify backup integrity without restoring

        Args:
            backup_name: Name of backup to verify

        Returns:
            Verification results
        """
        logger.info(f"Verifying backup: {backup_name}")

        try:
            archive_path = self.backup_dir / f"{backup_name}.tar.gz"

            if not archive_path.exists():
                return {
                    "success": False,
                    "error": "Backup archive not found"
                }

            # Test archive integrity
            with tarfile.open(archive_path, "r:gz") as tar:
                members = tar.getmembers()

            # Extract and check metadata
            extract_path = self._extract_backup(archive_path, backup_name)
            metadata_path = extract_path / "backup_metadata.json"

            if not metadata_path.exists():
                return {
                    "success": False,
                    "error": "Backup metadata missing"
                }

            with open(metadata_path, 'r') as f:
                metadata = json.load(f)

            # Verify database backup exists
            db_file_exists = any(extract_path.glob("database_*.sql"))

            # Clean up
            self._cleanup_temp_files(extract_path)

            logger.info("✓ Backup verification passed")

            return {
                "success": True,
                "backup_name": backup_name,
                "backup_date": metadata.get("datetime"),
                "total_files": len(members),
                "database_backup": db_file_exists,
                "size_mb": metadata.get("backup_size_mb", 0)
            }

        except Exception as e:
            logger.error(f"Backup verification failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }

# Singleton instance
restore_service = RestoreService()
