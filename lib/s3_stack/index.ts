import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as eventSource from 'aws-cdk-lib/aws-lambda-event-sources';
import {
  PROD,
  S3_KMS_KEY,
  S3_GOLD_ZONE_BUCKET,
  S3_LANDING_ZONE_BUCKET,
  S3_PROCESSED_ZONE_BUCKET,
  getEnvironmentConfiguration,
  getLogicalIdPrefix,
  getResourceNamePrefix,
} from '../config/index.ts';
import { StorageClass } from 'aws-cdk-lib/aws-s3';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';

export class S3BucketZonesStack extends cdk.Stack {
  // class properties
  private logicalIdPrefix: string;
  private resourceNamePrefix: string;
  private removalPolicy: cdk.RemovalPolicy;
  private targetEnvironment: string;

  constructor(
    scope: Construct,
    id: string,
    targetEnvironment: string,
    props?: cdk.StackProps,
  ) {
    super(scope, id, props);

    const mappings = getEnvironmentConfiguration(targetEnvironment);
    this.logicalIdPrefix = getLogicalIdPrefix();
    this.resourceNamePrefix = getResourceNamePrefix();
    this.targetEnvironment = targetEnvironment;
    let removalPolicy = cdk.RemovalPolicy.DESTROY;
    if (targetEnvironment === PROD) {
      removalPolicy = cdk.RemovalPolicy.RETAIN;
    }

    const s3KmsKey = this.createKmsKey(this.account);

    // Define bucket names
    const accessLogBucketName = `${targetEnvironment.toLowerCase()}-${
      this.resourceNamePrefix
    }-logs-${this.account}-${this.region}`;
    const landingZoneBucketName = `${targetEnvironment.toLowerCase()}-${
      this.resourceNamePrefix
    }-lz-${this.account}-${this.region}`;
    const goldZoneBucketName = `${targetEnvironment.toLowerCase()}-${
      this.resourceNamePrefix
    }-gz-${this.account}-${this.region}`;
    const processedZoneBucketName = `${targetEnvironment.toLowerCase()}-${
      this.resourceNamePrefix
    }-pz-${this.account}-${this.region}`;

    // Create buckets
    const accessLogsBucket = this.createAccessLogBucket(
      `${targetEnvironment}${this.logicalIdPrefix}AccessLogsBucket`,
      accessLogBucketName,
    );

    const landingZoneBucket = this.createDataLakeZoneBucket(
      `${targetEnvironment}${this.logicalIdPrefix}LandingZoneBucket`,
      landingZoneBucketName,
      accessLogsBucket,
      s3KmsKey,
    );

    const goldZoneBucket = this.createDataLakeZoneBucket(
      `${targetEnvironment}${this.logicalIdPrefix}GoldZoneBucket`,
      goldZoneBucketName,
      accessLogsBucket,
      s3KmsKey,
    );

    const processedZoneBucket = this.createDataLakeZoneBucket(
      `${targetEnvironment}${this.logicalIdPrefix}ProcessedZoneBucket`,
      processedZoneBucketName,
      accessLogsBucket,
      s3KmsKey,
    );

    // S3 Notification Topic
    const metadataChangeCaptureTopic = new sns.Topic(
      this,
      `${targetEnvironment}${this.logicalIdPrefix}MetadataChangeCaptureTopic`,
      {
        topicName: `${targetEnvironment.toLowerCase()}-${
          this.resourceNamePrefix
        }-metadata-change-capture-topic`,
      },
    );

    goldZoneBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.SnsDestination(metadataChangeCaptureTopic),
      {
        prefix: 'metadata/',
      },
    );

    goldZoneBucket.addEventNotification(
      s3.EventType.OBJECT_REMOVED,
      new s3n.SnsDestination(metadataChangeCaptureTopic),
      {
        prefix: 'metadata/',
      },
    );

    new s3deploy.BucketDeployment(this, 'DeployLZAssets', {
      sources: [s3deploy.Source.asset('./lib/assets/landing_zone_assets')],
      destinationBucket: landingZoneBucket,
      prune: false,
      retainOnDelete: false,
    });

    new s3deploy.BucketDeployment(this, 'DeployGZAssets', {
      sources: [s3deploy.Source.asset('./lib/assets/gold_zone_assets')],
      destinationBucket: goldZoneBucket,
      prune: false,
      retainOnDelete: false,
    });

    type NotificationFilter = {
      prefix: string;
      suffix: string | null;
    };
    const s3NotificationFilterDict: NotificationFilter[] = [
      { prefix: 'raw-data/', suffix: '.xlsx' },
      { prefix: 'raw-data/', suffix: '.XLSX' },
      { prefix: 'raw-data/', suffix: '.txt' },
      { prefix: 'raw-data/', suffix: '.TXT' },
    ];

    this.addPreprocessorLambda(
      landingZoneBucket,
      s3NotificationFilterDict,
      s3KmsKey,
    );
    // Stack Outputs that are programmatically synchronized
    new cdk.CfnOutput(
      this,
      `${targetEnvironment}${this.logicalIdPrefix}KmsKeyArn`,
      {
        value: s3KmsKey.keyArn,
        exportName: mappings[S3_KMS_KEY],
      },
    );
    new cdk.CfnOutput(
      this,
      `${targetEnvironment}${this.logicalIdPrefix}LandingZoneBucketName`,
      {
        value: landingZoneBucket.bucketName,
        exportName: mappings[S3_LANDING_ZONE_BUCKET],
      },
    );
    new cdk.CfnOutput(
      this,
      `${targetEnvironment}${this.logicalIdPrefix}GoldZoneBucketName`,
      {
        value: goldZoneBucket.bucketName,
        exportName: mappings[S3_GOLD_ZONE_BUCKET],
      },
    );

    new cdk.CfnOutput(
      this,
      `${targetEnvironment}${this.logicalIdPrefix}PurposeBuiltBucketName`,
      {
        value: processedZoneBucket.bucketName,
        exportName: mappings[S3_PROCESSED_ZONE_BUCKET],
      },
    );
    new cdk.CfnOutput(
      this,
      `${targetEnvironment}${this.logicalIdPrefix}MetadataChangeCaptureTopicArn`,
      {
        value: metadataChangeCaptureTopic.topicArn,
        exportName: 'MetadataChangeCaptureTopicArn',
      },
    );
  }

  /**
   * Creates an AWS KMS Key and attaches a Key policy
   *
   * @param deployment_account_id: The id for the deployment account
   * @returns kms key object
   */
  private createKmsKey(deploymentAccountId: string): kms.Key {
    const s3KmsKey = new kms.Key(
      this,
      `${this.targetEnvironment}${this.logicalIdPrefix}KmsKey`,
      {
        admins: [new iam.AccountPrincipal(this.account)],
        description: 'Key used for encrypting Data Lake S3 Buckets',
        removalPolicy: this.removalPolicy,
        alias: `${this.targetEnvironment.toLowerCase()}-${
          this.resourceNamePrefix
        }-s3-kms-key`,
        enableKeyRotation: true,
      },
    );

    // Policy to allow the deployment account and this account access to use the key
    s3KmsKey.addToResourcePolicy(
      new iam.PolicyStatement({
        principals: [
          new iam.AccountPrincipal(this.account),
          new iam.AccountPrincipal(deploymentAccountId),
        ],
        actions: [
          'kms:Encrypt',
          'kms:Decrypt',
          'kms:ReEncrypt*',
          'kms:GenerateDataKey*',
          'kms:DescribeKey',
        ],
        resources: ['*'],
      }),
    );

    // Assigning key access to other roles
    const policy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'kms:Encrypt',
        'kms:Decrypt',
        'kms:ReEncrypt*',
        'kms:GenerateDataKey*',
        'kms:DescribeKey',
      ],
      resources: [s3KmsKey.keyArn],
    });

    const dataSyncRoleName = `${this.targetEnvironment.toLowerCase()}-${
      this.resourceNamePrefix
    }-data-sync-role`;
    iam.Role.fromRoleArn(
      this,
      'importedDataSyncRoleKms',
      `arn:aws:iam::${this.account}:role/${dataSyncRoleName}`,
    ).addToPrincipalPolicy(policy);

    const batchJobRoleName = `${this.targetEnvironment.toLowerCase()}-${
      this.resourceNamePrefix
    }-batch-job-role`;
    iam.Role.fromRoleArn(
      this,
      'importedBatchJobRoleKms',
      `arn:aws:iam::${this.account}:role/${batchJobRoleName}`,
    ).addToPrincipalPolicy(policy);

    const batchTaskExecutionRoleName = `${this.targetEnvironment.toLowerCase()}-${
      this.resourceNamePrefix
    }-batch-task-execution-role`;
    iam.Role.fromRoleArn(
      this,
      'importedBatchTaskExecRoleKms',
      `arn:aws:iam::${this.account}:role/${batchTaskExecutionRoleName}`,
    ).addToPrincipalPolicy(policy);

    return s3KmsKey;
  }

  /**
   * Creates an Amazon S3 bucket and attaches bucket policy with necessary guardrails.
   * It enables server-side encryption using provided KMS key and leverage S3 bucket key feature.
   *
   * @param logicalId:str : The logical id to apply to the bucket
   * @param bucketName:str : The name for the bucket resource
   * @param accessLogBucke:s3.bucket_name: The bucket to target for Access Logging
   * @param s3KmsKey: The KMS Key to use for encryption of data at rest
   *
   * @returns S3 Bucket object
   */
  private createDataLakeZoneBucket(
    logicalId: string,
    bucketName: string,
    accessLogBucket: s3.Bucket,
    s3KmsKey: kms.Key,
  ) {
    let versioned: boolean = false;
    let lifecycleRules: s3.LifecycleRule[] = [
      {
        id: `${this.targetEnvironment.toLowerCase()}-${
          this.resourceNamePrefix
        }-life-cycle-rule`,
        enabled: false,
        expiration: cdk.Duration.days(3650),
      },
    ];
    //TODO: remove lifecycle rules and implement as separate batch job using lcm_tag
    if (this.targetEnvironment === PROD) {
      versioned = true;
      lifecycleRules: [
        {
          id: `${this.targetEnvironment.toLowerCase()}-${
            this.resourceNamePrefix
          }-life-cycle-rule`,
          enabled: false,
          expiration: cdk.Duration.days(2555),
          noncurrentVersionExpiration: cdk.Duration.days(90),
          transitions: [
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(365),
            },
          ],
        },
      ];
    }
    const bucket: s3.Bucket = new s3.Bucket(this, logicalId, {
      accessControl: s3.BucketAccessControl.PRIVATE,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      bucketKeyEnabled: true,
      bucketName: bucketName,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: s3KmsKey,
      lifecycleRules: lifecycleRules,
      publicReadAccess: false,
      removalPolicy: this.removalPolicy,
      versioned: versioned,
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_PREFERRED,
      serverAccessLogsBucket: accessLogBucket,
      serverAccessLogsPrefix: bucketName,
    });

    let policyStatements: iam.PolicyStatement[] = [
      new iam.PolicyStatement({
        sid: 'OnlyAllowSecureTransport',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:GetObject', 's3:PutObject'],
        resources: [`${bucket.bucketArn}/*`],
        conditions: { Bool: { 'aws:SecureTransport': 'false' } },
      }),
    ];

    // Prevents user deletion of buckets
    if (this.targetEnvironment == PROD) {
      policyStatements.push(
        new iam.PolicyStatement({
          sid: 'BlockUserDeletionOfBucket',
          effect: iam.Effect.DENY,
          principals: [new iam.AnyPrincipal()],
          actions: ['s3:DeleteBucket'],
          resources: [bucket.bucketArn],
          conditions: {
            StringLike: {
              'aws:userId': `arn:aws:iam::${this.account}:user/*`,
            },
          },
        }),
      );
    }
    // Example of how to use these statements in a policy document
    // const policyDocument = new iam.PolicyDocument({
    // statements: policyStatements
    // });

    for (let policy of policyStatements) {
      bucket.addToResourcePolicy(policy);
    }

    return bucket;
  }

  /**
    Creates an Amazon S3 bucket to store S3 server access logs. It attaches bucket policy with necessary guardrails.
    It enables server-side encryption using provided KMS key and leverage S3 bucket key feature.

    @param logical_id:str: The logical id to apply to the bucket
    @param bucket_name:str: The name for the bucket resource
    @param s3_kms_key:kms.key: The KMS Key to use for encryption of data at rest

    @return: The bucket that was created
   */
  private createAccessLogBucket(
    logicalId: string,
    bucketName: string,
  ): s3.Bucket {
    return new s3.Bucket(this, logicalId, {
      accessControl: s3.BucketAccessControl.LOG_DELIVERY_WRITE,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      // bucketKeyEnabled=True,
      bucketName: bucketName,
      encryption: s3.BucketEncryption.S3_MANAGED,
      // encryption_key=s3KmsKey,
      publicReadAccess: false,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      versioned: true,
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_PREFERRED,
    });
  }

  /**
   * Creates an Amazon S3 bucket event notification to trigger a lambda function
   *
   * @param landing_zone_bucket:str: Landing Zone bucket name
   * @param s3_notification_filter:list: list of prefix and suffix for filter the events e.g. s3 prefix
   * @param s3_kms_key:kms.key: The KMS Key to use for encryption of data at rest
   */
  private addPreprocessorLambda(
    landingZoneBucket: s3.Bucket,
    s3NotificationFilterRec: Record<string, any>,
    s3KmsKey: kms.Key,
  ) {
    const roleName = `${this.targetEnvironment.toLowerCase()}-${
      this.resourceNamePrefix
    }}-lambda-role`;
    let lambdaRole = iam.Role.fromRoleArn(
      this,
      'importedLambdaRoleKms',
      `arn:aws:iam::${this.account}:role/${roleName}`,
    );

    lambdaRole.addToPrincipalPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['kms:*'],
        resources: [s3KmsKey.keyArn],
      }),
    );

    const snsTopicArn = cdk.Fn.importValue('StatusUpdateTopicArn');

    const fnName = `${this.targetEnvironment.toLowerCase()}-${
      this.resourceNamePrefix
    }-preprocessor`;
    //creating lambda fn using already created docker image
    const repo = ecr.Repository.fromRepositoryName(
      this,
      'Repository1',
      'wdl-preprocessor-lambda-image',
    );

    let lambdaFn = new lambda.DockerImageFunction(this, fnName, {
      functionName: fnName,
      code: lambda.DockerImageCode.fromEcr(repo, {
        tagOrDigest: 'latest',
      }),
      description: `[${this.targetEnvironment.toLowerCase()}] Wren Data Lake Preprocessor Lambda`,
      retryAttempts: 1,
      timeout: cdk.Duration.seconds(900),
      environment: {
        ENV: this.targetEnvironment,
        RESOURCE_PREFIX: this.resourceNamePrefix,
        RETRY_COUNT: '5',
        SFN_ARN: `arn:aws:states:${this.region}:${
          this.account
        }:stateMachine:${this.targetEnvironment.toLowerCase()}-${
          this.resourceNamePrefix
        }-pk-data-pipeline`,
        STATUS_SNS_TOPIC_ARN: snsTopicArn,
      },
      role: lambdaRole,
    });

    // adding notification to bucket
    for (let key in s3NotificationFilterRec) {
      let filterCondition = s3NotificationFilterRec[key];
      if (filterCondition.prefix && filterCondition.suffix) {
        lambdaFn.addEventSource(
          new eventSource.S3EventSource(landingZoneBucket, {
            events: [s3.EventType.OBJECT_CREATED],
            filters: [
              {
                prefix: filterCondition['prefix'],
                suffix: filterCondition['suffix'],
              },
            ],
          }),
        );
      } else if (filterCondition.prefix) {
        lambdaFn.addEventSource(
          new eventSource.S3EventSource(landingZoneBucket, {
            events: [s3.EventType.OBJECT_CREATED],
            filters: [{ prefix: filterCondition['prefix'] }],
          }),
        );
      } else if (filterCondition.suffix) {
        lambdaFn.addEventSource(
          new eventSource.S3EventSource(landingZoneBucket, {
            events: [s3.EventType.OBJECT_CREATED],
            filters: [{ prefix: filterCondition['suffix'] }],
          }),
        );
      }
    }
  }
}
