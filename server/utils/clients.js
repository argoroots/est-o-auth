import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { SESClient } from '@aws-sdk/client-ses'
import { SNSClient } from '@aws-sdk/client-sns'
import Stripe from 'stripe'

// Shared SDK clients, one per process, created on first use so missing config surfaces on a request rather than at import
const cache = {}

// Creates the named client once and returns the same instance afterwards
function once (name, create) {
  cache[name] ??= create()

  return cache[name]
}

// Region and credentials for every AWS client
function awsOptions () {
  const config = useRuntimeConfig()

  return {
    region: config.awsRegion,
    credentials: {
      accessKeyId: config.awsId,
      secretAccessKey: config.awsSecret
    }
  }
}

// DynamoDB client (sessions, clients, usage)
export const getDynamo = () => once('dynamo', () => new DynamoDBClient(awsOptions()))

// SES client (e-mail codes)
export const getSes = () => once('ses', () => new SESClient(awsOptions()))

// SNS client (SMS codes)
export const getSns = () => once('sns', () => new SNSClient(awsOptions()))

// Stripe client (signup and metered billing)
export const getStripe = () => once('stripe', () => new Stripe(useRuntimeConfig().stripeKey))
