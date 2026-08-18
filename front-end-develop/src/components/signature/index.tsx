import React from "react";
import { Stack, ButtonToolbar, Panel, PanelGroup, Text } from "rsuite";
import Button from "@/components/button";
import Upload from "@/components/supportingDocuments/upload";
import ViewComment from "@/components/comment/viewComment";
import { SignatureState } from "@/types/signatureTypes";
import "./styles.css";

interface SignatureUIProps {
  state: SignatureState;
  translation: any;
  enableCapture: boolean;
  enrollmentId: string;
  setTab: (tab: string) => void;
  onRetake: () => void;
  onStartCapture: () => void;
  onInitDevices: () => void;
  onCancelCapture: () => void;
  onSubmit: () => void;
  setSupportingDocuments: (docs: any[]) => void;
  setOpenCommentModal: (open: boolean) => void;
  setUpdatedComment: (comment: string) => void;
  canCapture: any;
}

export const SignatureUI: React.FC<SignatureUIProps> = ({
  state,
  translation,
  enableCapture,
  enrollmentId,
  setTab,
  onRetake,
  onStartCapture,
  onInitDevices,
  onCancelCapture,
  onSubmit,
  setSupportingDocuments,
  setOpenCommentModal,
  setUpdatedComment,
  canCapture,
}) => {
  const {
    supportingDocuments,
    capturing,
    sigImg,
    sigTxt,
    capDialog,
    isSubmitting,
    comment,
  } = state;

  return (
    <>
      <ViewComment comment={comment} />
      <PanelGroup accordion>
        {supportingDocuments && supportingDocuments.length > 0 && (
          <Panel
            header={
              <Text className="textPrimary">
                {translation.supporting_documents}
              </Text>
            }
          >
            <Upload
              files={supportingDocuments}
              setFiles={setSupportingDocuments}
              referenceType="ENROLLMENT_SIGNATURE"
              referenceId={enrollmentId || ""}
              showUploadButton
              name="signature"
              enrollmentId={enrollmentId}
            />
          </Panel>
        )}
      </PanelGroup>

      <Panel>
        {capturing ? (
          <div
            id="signatureCaptureWindow"
            // style={{
            //   width: 600,
            //   height: 450,
            // }}
          />
        ) : (
          <div style={{ minHeight: "40vh" }} />
        )}

        <div hidden={capturing || !sigImg} id="signatureImageWrapper">
          <div style={{ textAlign: "center", width: "50%" }}>
            <img
              id="signatureImage"
              src={sigImg}
              style={{
                aspectRatio: "3/2",
                width: "100%",
                height: "auto",
                objectFit: "contain",
              }}
              alt="Captured signature"
            />
          </div>
        </div>

        <Stack>
          <Stack.Item grow={1}>
            <ButtonToolbar>
              <Button
                text={translation.go_back}
                onClick={() => setTab("fingerprint")}
                appearance="default"
              />
            </ButtonToolbar>
          </Stack.Item>
          <Stack.Item>
            <ButtonToolbar>
              {sigTxt !== "" ? (
                <Button text={translation.retake} onClick={onRetake} />
              ) : (
                enableCapture && (
                  <>
                    <Button
                      text={translation.comment}
                      onClick={() => {
                        setOpenCommentModal(true);
                        setUpdatedComment(comment);
                      }}
                      testId="comment"
                      startIcon="add"
                      appearance="default"
                    />
                    <Button
                      text={translation.connect_device}
                      onClick={onInitDevices}
                      disabled={canCapture}
                    />
                    <Button
                      hidden={!capDialog || !capturing}
                      onClick={onCancelCapture}
                      text={translation.cancel}
                      appearance="primary"
                      color="red"
                    />
                    {canCapture && (
                      <Button
                        text={translation.start}
                        disabled={!canCapture}
                        onClick={onStartCapture}
                      />
                    )}
                  </>
                )
              )}

              <Button
                text={translation.next}
                onClick={onSubmit}
                loading={isSubmitting}
              />
            </ButtonToolbar>
          </Stack.Item>
        </Stack>
      </Panel>
    </>
  );
};

export const InitializingSDK = () => (
  <span>Initializing SDK, this could take a few seconds...</span>
);

export const InitializingLicense = () => <span>Initializing License ...</span>;
