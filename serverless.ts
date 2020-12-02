import type { Serverless } from 'serverless/aws';

const serverlessConfiguration: Serverless = {
  service: 'challenge',
    // app and org for use with dashboard.serverless.com
    // app: your-app-name,
    // org: your-org-name,

  frameworkVersion: '2',
  custom: {
    webpack: {
      webpackConfig: './webpack.config.js',
      includeModules: true
    }
  },
  // Add the serverless-webpack plugin
  plugins: ['serverless-webpack'],
  provider: {
    name: 'aws',
    runtime: 'nodejs12.x',
    apiGateway: {
      minimumCompressionSize: 1024,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
	    API_CLIENT: '${ssm:/twitch/client}',
	    API_SECRET: '${ssm:/twitch/secret}'
    },
  },
  functions: {
    videoGameInfo: {
      handler: 'handler.getInfo',
	    memorySize: 128
    },
  }
}

module.exports = serverlessConfiguration;
