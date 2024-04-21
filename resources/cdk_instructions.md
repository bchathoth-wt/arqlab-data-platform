# CDK Instructions

## Set up Instructions

This is a blank project for TypeScript development with CDK.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

This project is set up like a standard TypeScript project. Initialization creates a `node_modules` directory and manages dependencies via `npm` (the Node.js package manager). Ensure that Node.js and npm are installed on your machine.

### Initial Setup

To install the required packages, including the AWS CDK libraries, run:

```bash
npm install
```

### Build and Synthesize

TypeScript projects need to be compiled before they can be synthesized or deployed. Run the following command to compile the TypeScript code into JavaScript:

```bash
npm run build
```

After building the project, you can synthesize the CloudFormation template for this code:

```bash
cdk synth
```

### Watch Mode

For development, you can use the watch mode to automatically compile changes when files are saved:

```bash
npm run watch
```

### Adding Dependencies

To add additional dependencies, such as other AWS CDK libraries, you can use npm to install them. For example, to install the Amazon S3 CDK library:

```bash
npm install @aws-cdk/aws-s3
```

After installing new libraries, remember to run `npm run build` to compile the changes.

---

## Useful commands

1. `cdk ls` - list all stacks in the app
1. `cdk synth` - emits the synthesized CloudFormation template
1. `cdk deploy` - deploy this stack to your default AWS account/region
1. `cdk diff` - compare deployed stack with current state
1. `cdk docs` - open CDK documentation

---

This setup ensures that you are ready to use TypeScript for your AWS CDK projects. It provides the tools needed to manage and deploy your cloud infrastructure code effectively.
