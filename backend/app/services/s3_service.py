"""
S3 Service for file storage operations
"""

import boto3
import logging
from typing import Optional, BinaryIO, Dict, Any
from botocore.exceptions import ClientError, NoCredentialsError
from fastapi import HTTPException
import os
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class S3Service:
    """Service for handling S3 file operations"""
    
    def __init__(self):
        self.bucket_name = os.getenv('S3_BUCKET_NAME', 'pipeline-pulse-uploads')
        self.region = os.getenv('AWS_REGION', 'ap-southeast-1')
        self.s3_client = None
        self.initialization_error = None

        try:
            # Initialize S3 client - let boto3 handle credentials automatically
            # In ECS, this will use the task's IAM role
            logger.info(f"🔧 Initializing S3 client for region: {self.region}")
            self.s3_client = boto3.client('s3', region_name=self.region)
            logger.info(f"🔧 S3 client created successfully")

            # Test connection with better error handling
            try:
                logger.info(f"🔧 Testing S3 bucket access: {self.bucket_name}")
                self.s3_client.head_bucket(Bucket=self.bucket_name)
                logger.info(f"✅ S3 service initialized successfully for bucket: {self.bucket_name}")
            except ClientError as e:
                error_code = e.response['Error']['Code']
                error_msg = e.response['Error']['Message']
                if error_code == '403':
                    logger.warning(f"⚠️  S3 bucket access denied for {self.bucket_name}: {error_msg}")
                    logger.warning(f"⚠️  Service will continue but S3 operations will fail")
                elif error_code == '404':
                    logger.warning(f"⚠️  S3 bucket {self.bucket_name} not found: {error_msg}")
                    logger.warning(f"⚠️  Service will continue but S3 operations will fail")
                else:
                    logger.warning(f"⚠️  S3 bucket test failed ({error_code}): {error_msg}")
                    logger.warning(f"⚠️  Service will continue but S3 operations will fail")
            except Exception as e:
                logger.warning(f"⚠️  S3 bucket test failed with unexpected error: {e}")
                logger.warning(f"⚠️  Service will continue but S3 operations will fail")

        except NoCredentialsError as e:
            error_msg = f"AWS credentials not found - check IAM role configuration: {e}"
            logger.error(f"❌ {error_msg}")
            self.initialization_error = error_msg
            self.s3_client = None
        except Exception as e:
            error_msg = f"Failed to initialize S3 service: {type(e).__name__}: {e}"
            logger.error(f"❌ {error_msg}")
            self.initialization_error = error_msg
            self.s3_client = None

    def _check_initialization(self):
        """Check if S3 service is properly initialized, raise HTTPException if not"""
        if self.s3_client is None:
            error_detail = self.initialization_error or "S3 service not initialized"
            logger.error(f"❌ S3 operation attempted but service not initialized: {error_detail}")
            raise HTTPException(status_code=500, detail=error_detail)
    
    async def upload_file(
        self,
        file_content: bytes,
        s3_key: str,
        content_type: str = 'text/csv',
        metadata: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """
        Upload file to S3

        Args:
            file_content: File content as bytes
            s3_key: S3 object key (file path in bucket)
            content_type: MIME type of the file
            metadata: Optional metadata to store with file

        Returns:
            Dict with upload result information
        """
        self._check_initialization()
        try:
            # Prepare upload parameters
            upload_params = {
                'Bucket': self.bucket_name,
                'Key': s3_key,
                'Body': file_content,
                'ContentType': content_type,
                'ServerSideEncryption': 'AES256'
            }
            
            # Add metadata if provided
            if metadata:
                upload_params['Metadata'] = metadata
            
            # Upload file
            response = self.s3_client.put_object(**upload_params)
            
            logger.info(f"File uploaded successfully to S3: s3://{self.bucket_name}/{s3_key}")
            
            return {
                'success': True,
                'bucket': self.bucket_name,
                's3_key': s3_key,
                's3_url': f"s3://{self.bucket_name}/{s3_key}",
                'etag': response.get('ETag', '').strip('"'),
                'version_id': response.get('VersionId'),
                'size_bytes': len(file_content)
            }
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            logger.error(f"Failed to upload file to S3: {error_code} - {e}")
            raise HTTPException(
                status_code=500, 
                detail=f"Failed to upload file to S3: {error_code}"
            )
    
    async def download_file(self, s3_key: str) -> bytes:
        """
        Download file from S3

        Args:
            s3_key: S3 object key

        Returns:
            File content as bytes
        """
        self._check_initialization()
        try:
            response = self.s3_client.get_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            
            file_content = response['Body'].read()
            logger.info(f"File downloaded successfully from S3: s3://{self.bucket_name}/{s3_key}")
            
            return file_content
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'NoSuchKey':
                logger.error(f"File not found in S3: s3://{self.bucket_name}/{s3_key}")
                raise HTTPException(status_code=404, detail="File not found")
            else:
                logger.error(f"Failed to download file from S3: {error_code} - {e}")
                raise HTTPException(
                    status_code=500, 
                    detail=f"Failed to download file from S3: {error_code}"
                )
    
    async def generate_presigned_url(
        self,
        s3_key: str,
        expiration: int = 3600,
        http_method: str = 'GET'
    ) -> str:
        """
        Generate presigned URL for file access

        Args:
            s3_key: S3 object key
            expiration: URL expiration time in seconds (default: 1 hour)
            http_method: HTTP method (GET for download, PUT for upload)

        Returns:
            Presigned URL string
        """
        self._check_initialization()
        try:
            if http_method == 'GET':
                url = self.s3_client.generate_presigned_url(
                    'get_object',
                    Params={'Bucket': self.bucket_name, 'Key': s3_key},
                    ExpiresIn=expiration
                )
            elif http_method == 'PUT':
                url = self.s3_client.generate_presigned_url(
                    'put_object',
                    Params={'Bucket': self.bucket_name, 'Key': s3_key},
                    ExpiresIn=expiration
                )
            else:
                raise ValueError(f"Unsupported HTTP method: {http_method}")
            
            logger.info(f"Generated presigned URL for: s3://{self.bucket_name}/{s3_key}")
            return url
            
        except ClientError as e:
            logger.error(f"Failed to generate presigned URL: {e}")
            raise HTTPException(
                status_code=500, 
                detail="Failed to generate download URL"
            )
    
    async def delete_file(self, s3_key: str) -> bool:
        """
        Delete file from S3

        Args:
            s3_key: S3 object key

        Returns:
            True if successful
        """
        self._check_initialization()
        try:
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            
            logger.info(f"File deleted successfully from S3: s3://{self.bucket_name}/{s3_key}")
            return True
            
        except ClientError as e:
            logger.error(f"Failed to delete file from S3: {e}")
            raise HTTPException(
                status_code=500, 
                detail="Failed to delete file from S3"
            )
    
    async def file_exists(self, s3_key: str) -> bool:
        """
        Check if file exists in S3

        Args:
            s3_key: S3 object key

        Returns:
            True if file exists
        """
        self._check_initialization()
        try:
            self.s3_client.head_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            return True
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == '404':
                return False
            else:
                logger.error(f"Error checking file existence: {e}")
                raise HTTPException(
                    status_code=500, 
                    detail="Failed to check file existence"
                )
    
    async def get_file_metadata(self, s3_key: str) -> Dict[str, Any]:
        """
        Get file metadata from S3

        Args:
            s3_key: S3 object key

        Returns:
            Dictionary with file metadata
        """
        self._check_initialization()
        try:
            response = self.s3_client.head_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            
            return {
                'size_bytes': response.get('ContentLength', 0),
                'last_modified': response.get('LastModified'),
                'etag': response.get('ETag', '').strip('"'),
                'content_type': response.get('ContentType', ''),
                'metadata': response.get('Metadata', {}),
                'version_id': response.get('VersionId')
            }
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'NoSuchKey':
                raise HTTPException(status_code=404, detail="File not found")
            else:
                logger.error(f"Failed to get file metadata: {e}")
                raise HTTPException(
                    status_code=500, 
                    detail="Failed to get file metadata"
                )
    
    def get_s3_url(self, s3_key: str) -> str:
        """
        Get S3 URL for a given key
        
        Args:
            s3_key: S3 object key
            
        Returns:
            S3 URL string
        """
        return f"s3://{self.bucket_name}/{s3_key}"
