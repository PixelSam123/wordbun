import type { Server } from 'bun'

type RouteHandler = (args: {
  req: Request
  server: Server
  trailingPath: string
}) => Response | undefined

export class Router {
  private readonly pathnameToHandler: {
    [pathname: string]: RouteHandler | undefined
  } = {}

  add(route: string, handler: RouteHandler): void {
    this.pathnameToHandler[route] = handler
  }

  handle(req: Request, server: Server): Response | undefined {
    const pathname = new URL(req.url).pathname

    let handler: RouteHandler | undefined
    let trailingPathIndex = pathname.length
    {
      let partialPathname = pathname

      for (
        let lastSlashIndex = partialPathname.lastIndexOf('/');
        lastSlashIndex !== -1;
        lastSlashIndex = partialPathname.lastIndexOf('/')
      ) {
        const handlerToAssign = this.pathnameToHandler[partialPathname]

        if (typeof handlerToAssign !== 'undefined') {
          handler = handlerToAssign
          break
        }

        partialPathname = partialPathname.slice(0, lastSlashIndex)
        trailingPathIndex = lastSlashIndex
      }
    }

    if (typeof handler === 'undefined') {
      return new Response('404 Not Found', { status: 404 })
    }

    return handler({
      req,
      server,
      trailingPath: pathname.slice(trailingPathIndex),
    })
  }
}
