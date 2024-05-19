#!/usr/bin/env node
//import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DataPlatformStack } from '../lib/data-platform-stack.js';
import { promptUser } from '../src/utils/userInput/index.js';

let targetEnv: string;
if (process.env.TARGEG_ENV === undefined) {
  console.log(
    '-----------------------------------------------------------------',
  );
  console.log('Please set environment variable ENV based on your setup.');
  console.log('e.g. export TARGEG_ENV=Dev');
  console.log('Valid values are: Dev, Test, and Prod');
  // If you want to create multiple environments, e.g., a second dev,
  // you can do it. But add environment to your configuration file or module.
  console.log(
    '-----------------------------------------------------------------',
  );
  process.exit(1);
  //const environment = await promptUser();
  //console.log(`Environment: ${environment}`);
} else {
  targetEnv = process.env.TARGEG_ENV;
  console.log(`Environment: ${targetEnv}`);
}

console.log('Starting CDK Synth....');

const app = new cdk.App();
new DataPlatformStack(app, 'DataPlatformStack', targetEnv, {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */
  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  env: {
    account: process.env.AWS_ACCOUNT,
    region: process.env.AWS_REGION,
  },
  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  // env: { account: '123456789012', region: 'us-east-1' },
  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});
