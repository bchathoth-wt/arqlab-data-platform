// Environments (targeted at accounts)
export const DEPLOYMENT = 'Deployment';
export const DEV = 'Dev';
export const DEV01 = 'Dev01';
export const DEV02 = 'Dev02';
export const TEST = 'Test';
export const TEST01 = 'Test01';
export const TEST02 = 'Test02';
export const PROD = 'Prod';

// Organization short name
const ORG = 'xyz';

// The following constants are used to map to parameter/secret paths
export const ENVIRONMENT = 'environment';

// Manual Inputs
export const GITHUB_REPOSITORY_OWNER_NAME = 'github_repository_owner_name';
export const GITHUB_REPOSITORY_NAME = 'github_repository_name';
export const ACCOUNT_ID = '1234567891234';
export const REGION = 'eu-west-02';
export const LOGICAL_ID_PREFIX = 'DataLake';
export const RESOURCE_NAME_PREFIX = ORG;
export const VPC_CIDR = 'vpc_cidr';
export const DB_NAME = `${ORG.toLowerCase()}_datamart`;
export const DB_ADMIN_USER = `${ORG.toLowerCase()}_db_admin`;
export const OPENSEARCH_ENABLED = false;

// Secrets Manager Inputs [not used in your Org]
export const GITHUB_TOKEN = 'github_token';

// Used in Automated Outputs
export const VPC_ID = 'vpc_id';
export const AVAILABILITY_ZONE_1 = 'availability_zone_1';
export const AVAILABILITY_ZONE_2 = 'availability_zone_2';
export const AVAILABILITY_ZONE_3 = 'availability_zone_3';
export const SUBNET_ID_1 = 'subnet_id_1';
export const SUBNET_ID_2 = 'subnet_id_2';
export const SUBNET_ID_3 = 'subnet_id_3';
export const PRIVATE_SUBNET_ID_1 = 'private_subnet_id_1';
export const PRIVATE_SUBNET_ID_2 = 'private_subnet_id_2';
export const PRIVATE_SUBNET_ID_3 = 'private_subnet_id_3';
export const PUBLIC_SUBNET_ID_1 = 'public_subnet_id_1';
export const PUBLIC_SUBNET_ID_2 = 'public_subnet_id_2';
export const PUBLIC_SUBNET_ID_3 = 'public_subnet_id_3';
export const ROUTE_TABLE_1 = 'route_table_1';
export const ROUTE_TABLE_2 = 'route_table_2';
export const ROUTE_TABLE_3 = 'route_table_3';
export const PRIVATE_ROUTE_TABLE_1 = 'private_route_table_1';
export const PRIVATE_ROUTE_TABLE_2 = 'private_route_table_2';
export const PRIVATE_ROUTE_TABLE_3 = 'private_route_table_3';
export const PUBLIC_ROUTE_TABLE_1 = 'public_route_table_1';
export const PUBLIC_ROUTE_TABLE_2 = 'public_route_table_2';
export const PUBLIC_ROUTE_TABLE_3 = 'public_route_table_3';
export const SHARED_SECURITY_GROUP_ID = 'shared_security_group_id';
export const S3_KMS_KEY = 's3_kms_key';
export const DB_KMS_KEY = 'db_kms_key';
export const S3_ACCESS_LOG_BUCKET = 's3_access_log_bucket';
export const S3_LANDING_ZONE_BUCKET = 's3_raw_bucket';
export const S3_GOLD_ZONE_BUCKET = 's3_conformed_bucket';
export const S3_PROCESSED_ZONE_BUCKET = 's3_purpose_built_bucket';
export const AURORA_CLUSTER_ARN = 'aurora_cluster_arn';

// Local configuration mapping based on environment
const localConfiguration: Record<string, any> = {
  [DEPLOYMENT]: {
    ACCOUNT_ID: '123456789123',
    REGION,
    GITHUB_REPOSITORY_OWNER_NAME: 'bchathoth-wt',
    GITHUB_REPOSITORY_NAME: '<your org>/data-platform-iac',
    LOGICAL_ID_PREFIX: 'DataLake',
    RESOURCE_NAME_PREFIX: ORG.toLowerCase(),
  },
  [DEV]: {
    ACCOUNT_ID: '123456789123',
    REGION,
    VPC_CIDR: '10.20.0.0/21',
  },
  [TEST]: {
    ACCOUNT_ID: '123456789123',
    REGION,
    VPC_CIDR: '10.10.0.0/21',
  },
  [PROD]: {
    ACCOUNT_ID: '987654321234',
    REGION,
    VPC_CIDR: '10.1.0.0/21',
  },
};

function getLocalConfiguration(environment: string): Record<string, any> {
  if (!localConfiguration[environment]) {
    throw new Error(
      `The requested environment: ${environment} does not exist in local mappings`,
    );
  }
  return localConfiguration[environment];
}

export function getEnvironmentConfiguration(
  environment: string,
): Record<string, any> {
  const cloudformationOutputMapping = {
    ENVIRONMENT: environment,
    VPC_ID: `${environment}VpcId`,
    AVAILABILITY_ZONE_1: `${environment}AvailabilityZone1`,
    AVAILABILITY_ZONE_2: `${environment}AvailabilityZone2`,
    AVAILABILITY_ZONE_3: `${environment}AvailabilityZone3`,
    SUBNET_ID_1: `${environment}SubnetId1`,
    SUBNET_ID_2: `${environment}SubnetId2`,
    SUBNET_ID_3: `${environment}SubnetId3`,
    PRIVATE_SUBNET_ID_1: `${environment}PrivateSubnetId1`,
    PRIVATE_SUBNET_ID_2: `${environment}PrivateSubnetId2`,
    PRIVATE_SUBNET_ID_3: `${environment}PrivateSubnetId3`,
    PUBLIC_SUBNET_ID_1: `${environment}PublicSubnetId1`,
    PUBLIC_SUBNET_ID_2: `${environment}PublicSubnetId2`,
    PUBLIC_SUBNET_ID_3: `${environment}PublicSubnetId3`,
    ROUTE_TABLE_1: `${environment}RouteTable1`,
    ROUTE_TABLE_2: `${environment}RouteTable2`,
    ROUTE_TABLE_3: `${environment}RouteTable3`,
    PRIVATE_ROUTE_TABLE_1: `${environment}PrivateRouteTable1`,
    PRIVATE_ROUTE_TABLE_2: `${environment}PrivateRouteTable2`,
    PRIVATE_ROUTE_TABLE_3: `${environment}PrivateRouteTable3`,
    PUBLIC_ROUTE_TABLE_1: `${environment}PublicRouteTable1`,
    PUBLIC_ROUTE_TABLE_2: `${environment}PublicRouteTable2`,
    PUBLIC_ROUTE_TABLE_3: `${environment}PublicRouteTable3`,
    SHARED_SECURITY_GROUP_ID: `${environment}SharedSecurityGroupId`,
    S3_KMS_KEY: `${environment}S3KmsKeyArn`,
    DB_KMS_KEY: `${environment}DbKmsKeyArn`,
    S3_ACCESS_LOG_BUCKET: `${environment}S3AccessLogBucket`,
    S3_LANDING_ZONE_BUCKET: `${environment}RawBucketName`,
    S3_GOLD_ZONE_BUCKET: `${environment}ConformedBucketName`,
    S3_PROCESSED_ZONE_BUCKET: `${environment}PurposeBuiltBucketName`,
    AURORA_CLUSTER_ARN: `${environment}AuroraClusterArn`,
  };

  return {
    ...cloudformationOutputMapping,
    ...getLocalConfiguration(environment),
  };
}

export function getAllConfigurations(): Record<string, any> {
  return {
    [DEPLOYMENT]: {
      ENVIRONMENT: DEPLOYMENT,
      GITHUB_TOKEN: '/DataLake/GitHubToken',
      ...getLocalConfiguration(DEPLOYMENT),
    },
    [DEV]: getEnvironmentConfiguration(DEV),
    [TEST]: getEnvironmentConfiguration(TEST),
    [PROD]: getEnvironmentConfiguration(PROD),
  };
}

export function getLogicalIdPrefix(): string {
  return getLocalConfiguration(DEPLOYMENT).LOGICAL_ID_PREFIX;
}

export function getResourceNamePrefix(): string {
  return getLocalConfiguration(DEPLOYMENT).RESOURCE_NAME_PREFIX;
}
