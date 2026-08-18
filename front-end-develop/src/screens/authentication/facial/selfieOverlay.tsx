import Icon from "@/components/icon";
import Loading from "@/components/loader";

function SelfieOverlay({
  status,
}: {
  status?: {
    loading: boolean;
    verified: boolean;
    failed: boolean;
    liveness?: boolean;
  };
}) {
  return (
    <>
      {status?.loading && (
        <div className="selfieOverlay" data-testid="selfie-overlay">
          <Loading />
        </div>
      )}
      {status?.verified && (
        <div className="selfieOverlay primary">
          <Icon name="done" styles={{ fontSize: 70, color: "var(--light)" }} />
        </div>
      )}
      {status?.failed && (
        <div className="selfieOverlay danger">
          <Icon name="close" styles={{ fontSize: 70, color: "var(--light)" }} />
        </div>
      )}
    </>
  );
}

export default SelfieOverlay;
