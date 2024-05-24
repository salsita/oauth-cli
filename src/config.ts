import 'dotenv/config'
import { cleanEnv, str } from 'envalid'

export const config = cleanEnv(process.env, {
  ISSUER: str({ default: undefined }),
  AUTHORIZATION_ENDPOINT: str({ default: undefined }),
  TOKEN_ENDPOINT: str({ default: undefined }),
  WELL_KNOWN_CONFIG: str({ default: undefined }),

  CLIENT_ID: str(),
  CLIENT_SECRET: str(),
  REDIRECT_URI: str(),
  SCOPE: str(),
})

if (
  (!config.WELL_KNOWN_CONFIG && (!config.ISSUER || !config.AUTHORIZATION_ENDPOINT || !config.TOKEN_ENDPOINT)) ||
  (config.WELL_KNOWN_CONFIG && (config.ISSUER || config.AUTHORIZATION_ENDPOINT || config.TOKEN_ENDPOINT))
) {
  throw new Error(
    'Either only WELL_KNOWN_CONFIG or all ISSUER, AUTHORIZATION_ENDPOINT, and TOKEN_ENDPOINT must be provided'
  )
}

export const issuerConfigOrDiscoveryUrl = config.WELL_KNOWN_CONFIG || {
  issuer: config.ISSUER!,
  authorization_endpoint: config.AUTHORIZATION_ENDPOINT!,
  token_endpoint: config.TOKEN_ENDPOINT!,
}
