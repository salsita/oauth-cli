# OAuth CLI

This is a simple CLI tool to get an OAuth tokens from a given OAuth2 provider.

## Pre-requisites

- Node.js 20 or later
- Browser on the same machine

## Usage

Just launch the tool with Node.js and follow the instructions:

```bash
node oauth.cjs > tokens.json
```

> **Note:** The file contains a shebang and can be executed directly without explicitly mentioning `node`
> if the file permissions are set correctly.

It will output a URL that you need to open in your browser. After you authenticate and authorize
the application, you can close the browser and tokens should be saved into the designated file
formatted as JSON.

If you intend to use the tokens in another application, you can output them as `.env` file by
passing the `env` format argument:

```bash
node oauth.cjs --format env > .env.tokens
```

## Configuration

The tool requires details about the OAuth2 server and the client. Both is expected
to be passed as environment variables, however `.env` file is also supported.

The following environment variables are required:

### OAuth2 Server Configuration

There are two ways to provide the server details. Either you can specify them directly
using the following variables:

- `ISSUER`
  - Must match the `iss` claim of an ID Token, if it is requested through the `openid` scope.
  - Can be any string, if the `openid` scope is not requested.
- `AUTHORIZATION_ENDPOINT`
  - The URL of the authorization endpoint.
  - Can be relative to the `ISSUER` if it starts with `.`.
- `TOKEN_ENDPOINT`
  - The URL of the token endpoint.
  - Can be relative to the `ISSUER` if it starts with `.`.

Or you utilize the `.well-known/openid-configuration` endpoint if the server exposes it:

- `WELL_KNOWN_CONFIG`
  - The URL of the `.well-known/openid-configuration` endpoint.

### OAuth2 Client Configuration

The client details obtained during registration of the client are expected to be passed as environment variables:

- `CLIENT_ID`
- `CLIENT_SECRET`
- `REDIRECT_URI`
  - This should be a `http://localhost[:<port>]` URL, as the CLI tool will start a local server to receive the callback.
  - The port for the callback server will be inferred from the URI and must be free at the time of execution.
  - The tool will warn if non-local URIs are used, but will still allow them in case of custom hosts overrides.
- `SCOPE`
  - A space-separated list of scopes that the client requests authorization for.
