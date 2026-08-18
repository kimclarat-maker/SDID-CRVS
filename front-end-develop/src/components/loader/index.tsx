import "./styles.css";
import { Loader } from "rsuite";

function Loading({
  className,
  size = "sm",
  isFullScreen,
}: {
  className?: string;
  size?: "lg" | "md" | "sm" | "xs";
  isFullScreen?: boolean;
}) {
  return (
    <div
      data-testid="loading"
      className={`${isFullScreen ? "fullscreen" : ""}`}
    >
      <Loader className={`${className}`} size={size} />
    </div>
  );
}

export default Loading;
