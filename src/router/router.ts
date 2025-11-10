export type Params = Record<string, string>;
export type View = (params?: Params) => void;

export type Route = {
  path: string; // e.g. "/", "/profiles", "/profiles/:name"
  view: View;
};

function matchPath(
  routePattern: string,
  currentPathname: string
): { matched: boolean; params: Params } {
  if (routePattern === currentPathname) return { matched: true, params: {} };

  const patternSegments = routePattern.split("/").filter(Boolean);
  const pathSegments = currentPathname.split("/").filter(Boolean);
  if (patternSegments.length !== pathSegments.length) {
    return { matched: false, params: {} };
  }

  const extractedParams: Params = {};
  for (
    let segmentIndex = 0;
    segmentIndex < patternSegments.length;
    segmentIndex++
  ) {
    const routeSegment = patternSegments[segmentIndex];
    const pathSegment = pathSegments[segmentIndex];
    if (routeSegment.startsWith(":")) {
      extractedParams[routeSegment.slice(1)] = decodeURIComponent(pathSegment);
    } else if (routeSegment !== pathSegment) {
      return { matched: false, params: {} };
    }
  }
  return { matched: true, params: extractedParams };
}

export class Router {
  private routes: Route[];
  private notFound: View;

  constructor(routes: Route[], _outlet: HTMLElement, notFound: View) {
    this.routes = routes;
    this.notFound = notFound;

    window.addEventListener("popstate", () => this.resolve());
    // Global link hijack
    document.addEventListener("click", (clickEvent) => {
      const eventTarget = clickEvent.target as HTMLElement | null;
      if (!eventTarget) return;
      const anchorElement = eventTarget.closest(
        "a[href]"
      ) as HTMLAnchorElement | null;
      if (!anchorElement) return;
      const hrefAttribute = anchorElement.getAttribute("href");
      if (!hrefAttribute) return;
      const isInternalNavigation =
        hrefAttribute.startsWith("/") && !anchorElement.target;
      if (!isInternalNavigation) return;
      clickEvent.preventDefault();
      this.navigate(hrefAttribute);
    });
  }

  navigate(path: string) {
    history.pushState({ path }, "", path);
    this.resolve();
  }

  resolve() {
    const currentPathname = window.location.pathname;
    for (const registeredRoute of this.routes) {
      const { matched, params } = matchPath(
        registeredRoute.path,
        currentPathname
      );
      if (matched) {
        registeredRoute.view(params);
        return;
      }
    }
    this.notFound();
  }
}
