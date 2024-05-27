import { fastify } from 'fastify'
import { SecureServerOptions } from 'http2'

export const waitForCallback = (port: number, path: string, httpsOptions: SecureServerOptions | undefined) => {
  return new Promise<string>((resolve, reject) => {
    const server = fastify({
      logger: false,
      // @ts-expect-error fastify types are wrong
      https: httpsOptions,
    })

    server.get(path, async (request, reply) => {
      const url = request.url
      reply.send('You can now close this tab')
      await server.close()
      resolve(url)
    })

    server.listen({ port }, err => {
      if (err) {
        reject(err)
      }
    })
  })
}
