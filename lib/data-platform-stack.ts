import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3_stack from './s3_stack/index.js';
import { getLogicalIdPrefix } from './config/index.js';

export class DataPlatformStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    targetEnvironment: string,
    props?: cdk.StackProps,
  ) {
    super(scope, id, props);

    const s3_buckets = new s3_stack.S3BucketZonesStack(
      this,
      `${getLogicalIdPrefix()}S3Zones`,
      targetEnvironment,
      props,
    );
  }
}
