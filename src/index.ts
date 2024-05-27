#!/usr/bin/env node
import { config, issuerConfigOrDiscoveryUrl } from './config.js'
import { createOAuthClient } from './oauth-client.js'
import { waitForCallback } from './callback-server.js'
import yarg from 'yargs'
import { hideBin } from 'yargs/helpers'
import type { SecureServerOptions } from 'http2'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const loadCerts = async (): Promise<SecureServerOptions> => {
  const isCjs = !!global.require
  if (isCjs) {
    return {
      cert: await readFile(global.require.resolve('./cert.pem')),
      key: await readFile(global.require.resolve('./key.pem')),
    }
  } else {
    return {
      cert: await readFile(fileURLToPath(import.meta.resolve('../dist/cert.pem'))),
      key: await readFile(fileURLToPath(import.meta.resolve('../dist/key.pem'))),
    }
  }
}

const run = async () => {
  const { format = 'json' } = await yarg(hideBin(process.argv)).choices('format', ['json', 'env']).parse()

  const scopeSet = new Set(config.SCOPE.split(' ').map(scope => scope.trim()))

  const parsedRedirectUri = new URL(config.REDIRECT_URI)

  if (parsedRedirectUri.hostname !== 'localhost') {
    console.warn('Warning: The redirect URI is not localhost. The callback from OAuth server may not recognized.')
  }

  const httpsOptions: SecureServerOptions | undefined =
    parsedRedirectUri.protocol === 'https:' ? await loadCerts() : undefined

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

  const baseUrl = client.authorizationUrl({
    scope: config.SCOPE,
  })

  const url = config.EXTRA_PARAMS ? `${baseUrl}&${config.EXTRA_PARAMS}` : baseUrl

  process.stderr.write(`Please open the following URL in your browser and authorize the request:\n${url}\n`)

  const callbackUrl = await waitForCallback(port, parsedRedirectUri.pathname, httpsOptions)

  const params = client.callbackParams(callbackUrl)
  if (params.state === '') {
    delete params.state
  }

  const tokenSet = scopeSet.has('openid')
    ? await client.callback(config.REDIRECT_URI, params)
    : await client.oauthCallback(config.REDIRECT_URI, params)

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
      id_token_claims: tokenSet.id_token ? tokenSet.claims() : undefined,
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
