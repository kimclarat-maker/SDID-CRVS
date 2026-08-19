import { Whisper, Tooltip } from "rsuite";
import { isDemoMode } from "@/demo/config";
import "./styles.css";

export default function DemoBadge() {
  if (!isDemoMode()) return null;

  return (
    <Whisper
      placement="bottom"
      trigger="hover"
      speaker={
        <Tooltip>
          This environment uses fictional data and does not connect to
          production services.
        </Tooltip>
      }
    >
      <span className="demo-badge">Demo environment</span>
    </Whisper>
  );
}
