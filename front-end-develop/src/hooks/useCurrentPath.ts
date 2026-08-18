import { routes as publicRoutes } from "@/navigation/Public";
import { routes as privateRoutes } from "@/navigation/Private";
import { routes as documentationRoutes } from "@/navigation/Doc";
import { useLocation, matchPath } from "react-router-dom";

export default () => {
  const location = useLocation();
  const { pathname } = location;

  // Matching the current pathname against each route path
  const matchedPath = [
    ...publicRoutes,
    ...privateRoutes,
    ...documentationRoutes,
  ].find(({ path }) => {
    // matchPath(pathname, path)
    const exactMatch = matchPath({ path: path as string }, pathname);
    if (exactMatch) return true;

    const partialMatch = matchPath({ path: `${path}/*` as string }, pathname);
    return !!partialMatch;
  });

  return {
    ...location,
    exist: matchedPath ? matchedPath : null,
  };
};
