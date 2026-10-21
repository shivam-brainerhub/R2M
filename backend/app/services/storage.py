import abc
import logging
import os
import re
import shutil
import uuid
from typing import Any, Dict, Optional
from urllib.parse import unquote, urlparse

from app.core.config import settings
from fastapi import HTTPException, UploadFile, status

logger = logging.getLogger(__name__)


class BaseStorageService(abc.ABC):
    """
    Abstract Storage Service protocol. Allows the application to switch
    between Local Storage and Cloud Storage (AWS S3, GCS, Cloudflare R2)
    seamlessly via configuration without code changes.
    """

    @abc.abstractmethod
    def save_file(
        self,
        file: UploadFile,
        folder: str = "general",
        allowed_extensions: Optional[set] = None,
        max_size_bytes: int = 50 * 1024 * 1024,
    ) -> Dict[str, Any]:
        """
        Saves an uploaded file and returns metadata including public URL,
        file name, and size.
        """

    @abc.abstractmethod
    def delete_file(self, url_or_path: str) -> bool:
        """
        Deletes a file by its URL or relative media path.
        """


class LocalStorageService(BaseStorageService):
    """
    Local filesystem storage provider that saves files to the mounted MEDIA_DIR.
    Public URLs are generated as `/media/{folder}/{filename}`.
    """

    def __init__(self, base_dir: Optional[str] = None):
        self.base_dir = base_dir or settings.MEDIA_DIR
        os.makedirs(self.base_dir, exist_ok=True)

    def _sanitize_filename(self, original_filename: str) -> tuple[str, str]:
        ext = os.path.splitext(original_filename)[1].lower()
        raw_stem = os.path.splitext(original_filename)[0]
        cleaned_stem = re.sub(r"[^\w-]", "_", raw_stem.strip().lower())
        if not cleaned_stem:
            cleaned_stem = "file"
        unique_suffix = uuid.uuid4().hex[:8]
        filename = f"{cleaned_stem}_{unique_suffix}{ext}"
        return filename, ext

    def save_file(
        self,
        file: UploadFile,
        folder: str = "general",
        allowed_extensions: Optional[set] = None,
        max_size_bytes: int = 50 * 1024 * 1024,
    ) -> Dict[str, Any]:
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file has no filename",
            )

        saved_filename, ext = self._sanitize_filename(file.filename)

        if allowed_extensions and ext not in allowed_extensions:
            allowed_list = ", ".join(sorted(allowed_extensions))
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file format '{ext}'. Allowed: {allowed_list}",
            )

        target_folder = os.path.join(self.base_dir, folder)
        os.makedirs(target_folder, exist_ok=True)
        target_path = os.path.join(target_folder, saved_filename)

        file.file.seek(0)
        size = 0
        with open(target_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            size = os.path.getsize(target_path)

        if size > max_size_bytes:
            os.remove(target_path)
            max_mb = max_size_bytes / (1024 * 1024)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File exceeds maximum allowed size of {max_mb:.1f}MB",
            )

        url = f"/media/{folder}/{saved_filename}"
        return {
            "url": url,
            "filename": saved_filename,
            "original_name": file.filename,
            "size": size,
            "content_type": file.content_type,
        }

    def delete_file(self, url_or_path: str) -> bool:
        if not url_or_path:
            return False

        parsed = urlparse(url_or_path)
        raw_path = unquote(parsed.path if parsed.path else url_or_path)
        clean_path = raw_path.lstrip("/")
        if clean_path.startswith("media/"):
            clean_path = clean_path[len("media/") :]

        base_dir_abs = os.path.abspath(self.base_dir)
        full_path = os.path.abspath(os.path.join(self.base_dir, clean_path))

        # Directory traversal prevention
        if not full_path.startswith(base_dir_abs) or full_path == base_dir_abs:
            logger.warning(f"Attempted path traversal or invalid path: {url_or_path}")
            return False

        try:
            if os.path.exists(full_path) and os.path.isfile(full_path):
                os.remove(full_path)
                logger.info(f"Deleted local media file: {full_path}")
                return True
        except Exception as e:
            logger.warning(f"Failed to delete local file {full_path}: {e}")
        return False


class S3StorageService(BaseStorageService):
    """
    Cloud Object Storage provider (AWS S3, MinIO, Cloudflare R2, Google Cloud Storage).
    Activated when STORAGE_BACKEND is set to 's3'.
    """

    def __init__(self):
        self.bucket = settings.S3_BUCKET_NAME
        self.access_key = settings.S3_ACCESS_KEY
        self.secret_key = settings.S3_SECRET_KEY
        self.region = settings.S3_REGION
        self.endpoint_url = settings.S3_ENDPOINT_URL or None
        self.custom_domain = settings.S3_CUSTOM_DOMAIN

    def _get_client(self):
        try:
            import boto3

            return boto3.client(
                "s3",
                aws_access_key_id=self.access_key,
                aws_secret_access_key=self.secret_key,
                region_name=self.region,
                endpoint_url=self.endpoint_url,
            )
        except ImportError:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="boto3 library is required for S3 storage backend.",
            )

    def save_file(
        self,
        file: UploadFile,
        folder: str = "general",
        allowed_extensions: Optional[set] = None,
        max_size_bytes: int = 50 * 1024 * 1024,
    ) -> Dict[str, Any]:
        if not self.bucket:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="S3 storage is enabled but S3_BUCKET_NAME is not configured.",
            )

        ext = os.path.splitext(file.filename or "")[1].lower()
        if allowed_extensions and ext not in allowed_extensions:
            allowed_list = ", ".join(sorted(allowed_extensions))
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file format '{ext}'. Allowed: {allowed_list}",
            )

        raw_stem = os.path.splitext(file.filename or "file")[0]
        cleaned_stem = re.sub(r"[^\w-]", "_", raw_stem.strip().lower())
        saved_filename = f"{cleaned_stem}_{uuid.uuid4().hex[:8]}{ext}"
        s3_key = f"{folder}/{saved_filename}"

        client = self._get_client()
        file.file.seek(0)
        content = file.file.read()
        size = len(content)

        if size > max_size_bytes:
            max_mb = max_size_bytes / (1024 * 1024)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File exceeds maximum allowed size of {max_mb:.1f}MB",
            )

        extra_args = {}
        if file.content_type:
            extra_args["ContentType"] = file.content_type

        file.file.seek(0)
        client.upload_fileobj(
            file.file,
            self.bucket,
            s3_key,
            ExtraArgs=extra_args,
        )

        if self.custom_domain:
            url = f"https://{self.custom_domain.rstrip('/')}/{s3_key}"
        elif self.endpoint_url:
            url = f"{self.endpoint_url.rstrip('/')}/{self.bucket}/{s3_key}"
        else:
            url = f"https://{self.bucket}.s3.{self.region}.amazonaws.com/{s3_key}"

        return {
            "url": url,
            "filename": saved_filename,
            "original_name": file.filename,
            "size": size,
            "content_type": file.content_type,
        }

    def delete_file(self, url_or_path: str) -> bool:
        if not self.bucket or not url_or_path:
            return False
        try:
            client = self._get_client()
            parsed = urlparse(url_or_path)
            raw_path = unquote(parsed.path if parsed.path else url_or_path).lstrip("/")
            if raw_path.startswith(f"{self.bucket}/"):
                s3_key = raw_path[len(f"{self.bucket}/") :]
            elif raw_path.startswith("media/"):
                s3_key = raw_path[len("media/") :]
            else:
                s3_key = raw_path
            client.delete_object(Bucket=self.bucket, Key=s3_key)
            logger.info(f"Deleted S3 object: {s3_key}")
            return True
        except Exception as e:
            logger.warning(f"Failed to delete S3 file {url_or_path}: {e}")
            return False


def get_storage_service() -> BaseStorageService:
    """
    Factory function returning the active storage service based on settings.
    """
    backend = settings.STORAGE_BACKEND.lower()
    if backend == "s3":
        return S3StorageService()
    return LocalStorageService()
