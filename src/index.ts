#!/usr/bin/env node
import { config, issuerConfigOrDiscoveryUrl } from './config.js'
import { createOAuthClient } from './oauth-client.js'
import { waitForCallback } from './callback-server.js'
import yarg from 'yargs'
import { hideBin } from 'yargs/helpers'

const run = async () => {
  const { format = 'json' } = await yarg(hideBin(process.argv)).choices('format', ['json', 'env']).parse()

  const parsedRedirectUri = new URL(config.REDIRECT_URI)

  if (parsedRedirectUri.hostname !== 'localhost') {
    console.warn('Warning: The redirect URI is not localhost. The callback from OAuth server may not recognized.')
  }

  const port = parsedRedirectUri.port
    ? parseInt(parsedRedirectUri.port)
    : parsedRedirectUri.protocol === 'https:'
      ? 443
      : 80

  const client = await createOAuthClient(issuerConfigOrDiscoveryUrl, {
    client_secret: config.CLIENT_SECRET,
    client_id: config.CLIENT_ID,
    redirect_uri: config.REDIRECT_URI,
  })

  const url = client.authorizationUrl({
    scope: config.SCOPE,
  })

  process.stderr.write(`Please open the following URL in your browser and authorize the request:\n${url}\n`)

  const callbackUrl = await waitForCallback(port, parsedRedirectUri.pathname)

  const params = client.callbackParams(callbackUrl)

  const tokenSet = await client.callback(config.REDIRECT_URI, params)

  if (format === 'env') {
    if (tokenSet.access_token !== undefined) {
      console.log(`ACCESS_TOKEN="${tokenSet.access_token}"`)
    }
    if (tokenSet.refresh_token !== undefined) {
      console.log(`REFRESH_TOKEN="${tokenSet.refresh_token}"`)
    }
    if (tokenSet.id_token !== undefined) {
      console.log(`ID_TOKEN="${tokenSet.id_token}"`)
    }
  } else {
    const result = {
      ...tokenSet,
      id_token_claims: tokenSet.claims(),
    }

    console.log(JSON.stringify(result, null, 2))
  }
}

run()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
