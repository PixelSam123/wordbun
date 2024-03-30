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

  add(pathname: string, handler: RouteHandler): void {
    this.pathnameToHandler[pathname] = handler
  }

  handle(req: Request, server: Server): Response | undefined {
    const pathname = new URL(req.url).pathname

    const { handler, partialPathname } = this.routePartialMatch(pathname)

    if (handler === null) {
      return new Response('404 Not Found', { status: 404 })
    }

    return handler({
      req,
      server,
      trailingPath: pathname.slice(partialPathname.length),
    })
  }

  /** Searches for a partial routing match right-to-left from the pathname */
  private routePartialMatch(pathname: string): {
    handler: RouteHandler | null
    partialPathname: string
  } {
    let partialPathname = pathname

    for (
      let lastSlashIndex = partialPathname.lastIndexOf('/');
      lastSlashIndex !== -1;
      lastSlashIndex = partialPathname.lastIndexOf('/')
    ) {
      const handler = this.pathnameToHandler[partialPathname]

      if (typeof handler !== 'undefined') {
        return { handler, partialPathname }
      }

      partialPathname = partialPathname.slice(0, lastSlashIndex)
    }

    return { handler: null, partialPathname: '' }
  }
}
