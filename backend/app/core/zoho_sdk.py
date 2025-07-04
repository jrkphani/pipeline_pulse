from zohocrmsdk.src.com.zoho.crm.api.dc import USDataCenter
from zohocrmsdk.src.com.zoho.api.authenticator.store import DBStore
from zohocrmsdk.src.com.zoho.api.logger import Logger
from zohocrmsdk.src.com.zoho.crm.api.initializer import Initializer
from zohocrmsdk.src.com.zoho.api.authenticator.oauth_token import OAuthToken
from zohocrmsdk.src.com.zoho.crm.api.sdk_config import SDKConfig
from urllib.parse import urlparse
from app.core.config import settings

def initialize_zoho_sdk():
    logger = Logger.get_instance(level=Logger.Levels.INFO, file_path="./zoho_sdk.log")
    environment = USDataCenter.PRODUCTION()
    token = OAuthToken(
        client_id=settings.ZOHO_CLIENT_ID,
        client_secret=settings.ZOHO_CLIENT_SECRET,
        refresh_token=settings.ZOHO_REFRESH_TOKEN,
        redirect_url=settings.ZOHO_REDIRECT_URI,
    )

    # Parse the DATABASE_URL
    db_url = urlparse(settings.DATABASE_URL)
    store = DBStore(
        host=db_url.hostname,
        database_name=db_url.path[1:],  # Remove leading slash
        user_name=db_url.username,
        password=db_url.password,
        port_number=db_url.port if db_url.port else 5432,
        table_name="oauthtokens",
    )
    config = SDKConfig(auto_refresh_fields=True, pick_list_validation=False)
    resource_path = "./zoho_sdk_resources"
    Initializer.initialize(
        environment=environment,
        token=token,
        store=store,
        sdk_config=config,
        resource_path=resource_path,
        logger=logger,
    )
