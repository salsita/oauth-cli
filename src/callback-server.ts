import Fastify from 'fastify'

export const waitForCallback = (port: number, path: string) => {
  return new Promise<string>((resolve, reject) => {
    const fastify = Fastify({
      logger: false,
    })

    fastify.get(path, async (request, reply) => {
      const url = request.url
      reply.send('You can now close this tab')
      await fastify.close()
      resolve(url)
    })

    fastify.listen({ port }, err => {
      if (err) {
        reject(err)
      }
    })
  })
}
