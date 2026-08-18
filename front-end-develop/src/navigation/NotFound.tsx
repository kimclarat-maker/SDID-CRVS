import NotFound from "@/screens/notFound";
import useCurrentPath from "@/hooks/useCurrentPath";

export default () => {
  const PATH = useCurrentPath();

  if (!PATH.exist) return <NotFound />;

  return <div></div>;
};
