import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { SESClient } from '@aws-sdk/client-ses'
import { SNSClient } from '@aws-sdk/client-sns'
import Stripe from 'stripe'

// Lazily created, shared SDK clients. One instance per process keeps connections alive between
// requests, and a missing configuration value surfaces on the first request rather than at import.
const cache = {}

function once (name, create) {
  cache[name] ??= create()

  return cache[name]
}

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

export const getDynamo = () => once('dynamo', () => new DynamoDBClient(awsOptions()))
export const getSes = () => once('ses', () => new SESClient(awsOptions()))
export const getSns = () => once('sns', () => new SNSClient(awsOptions()))
export const getStripe = () => once('stripe', () => new Stripe(useRuntimeConfig().stripeKey))
