import { Issuer } from 'openid-client'

export interface OAuthServerParams {
  issuer: string
  authorization_endpoint: string
  token_endpoint: string
}

export interface OAuthClientParams {
  client_id: string
  client_secret: string
  redirect_uri: string
}

const relativeToAbsolute = (url: string, base: string) => {
  if (url.startsWith('.')) {
    return new URL(url, base + '/').toString()
  }
  return url
}

export const createOAuthClient = async (
  serverParamsOrDiscoveryUrl: OAuthServerParams | string,
  { client_secret, client_id, redirect_uri }: OAuthClientParams
) => {
  const issuerInstance =
    typeof serverParamsOrDiscoveryUrl === 'string'
      ? await Issuer.discover(serverParamsOrDiscoveryUrl)
      : new Issuer({
          issuer: serverParamsOrDiscoveryUrl.issuer,
          authorization_endpoint: relativeToAbsolute(
            serverParamsOrDiscoveryUrl.authorization_endpoint,
            serverParamsOrDiscoveryUrl.issuer
          ),
          token_endpoint: relativeToAbsolute(
            serverParamsOrDiscoveryUrl.token_endpoint,
            serverParamsOrDiscoveryUrl.issuer
          ),
        })

  return new issuerInstance.Client({
    client_id: client_id,
    client_secret: client_secret,
    redirect_uris: [redirect_uri],
  })
}
