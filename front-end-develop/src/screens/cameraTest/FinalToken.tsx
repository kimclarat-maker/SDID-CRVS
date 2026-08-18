import { Panel, Stack, FlexboxGrid, Tag } from "rsuite";
import type { LiveEnrollMessage } from "./types/enroll";

export default function EnrollFromCameraFinalToken({
  tokenRef,
  lastMsg,
}: {
  tokenRef: any;
  lastMsg: LiveEnrollMessage;
}) {
  const isComplete =
    lastMsg?.type === "complete" || lastMsg?.type === "forceCapture";
  const hasTemplate = isComplete && lastMsg.payload.templateBase64;

  return (
    <Panel
      bordered
      header={
        <FlexboxGrid justify="space-between" align="middle">
          <FlexboxGrid.Item>
            <Stack spacing={8}>
              <h5 className="mb-0">Token Image</h5>
            </Stack>
          </FlexboxGrid.Item>
          <FlexboxGrid.Item>
            {isComplete ? (
              <Tag color="green" size="sm">
                Complete
              </Tag>
            ) : (
              <Tag color="blue" size="sm">
                Waiting
              </Tag>
            )}
          </FlexboxGrid.Item>
        </FlexboxGrid>
      }
    >
      <Stack direction="column" spacing={12}>
        {/* Token Image Display */}
        <div
          className="bg-light rounded d-flex align-items-center justify-content-center position-relative"
          style={{
            aspectRatio: "1/1",
            minHeight: "200px",
            border: "1px solid #dee2e6",
          }}
        >
          <img
            ref={tokenRef}
            className="img-fluid"
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
            }}
            alt="Captured token"
          />

          {/* Placeholder when no image */}
          {(!lastMsg || !isComplete) && (
            <div className="position-absolute text-center text-muted">
              <div className="mt-2">No token captured yet</div>
            </div>
          )}
        </div>
      </Stack>
    </Panel>
  );
}
