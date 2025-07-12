import type { Server } from 'bun'

type RouteHandler = (args: {
  req: Request
  server: Server
  /** Probably includes the slash */
  trailingPath: string
}) => Response | undefined

type RouterConfig = {
  corsOrigins: string[]
}

export class Router {
  private readonly pathnameToHandler: {
    [pathname: string]: RouteHandler | undefined
  } = {}

  constructor(private readonly config: RouterConfig) {}

  add(pathname: string, handler: RouteHandler): void {
    this.pathnameToHandler[pathname] = handler
  }

  handle(req: Request, server: Server): Response | undefined {
    const pathname = new URL(req.url).pathname

    const { handler, partialPathname } = this.routePartialMatch(pathname)

    const response =
      handler === null
        ? new Response('404 Not Found', { status: 404 })
        : handler({
            req,
            server,
            trailingPath: pathname.slice(partialPathname.length),
          })

    const origin = req.headers.get('Origin')
    if (origin && this.config.corsOrigins.includes(origin)) {
      response?.headers.set('Access-Control-Allow-Origin', origin)
    }

    return response
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
