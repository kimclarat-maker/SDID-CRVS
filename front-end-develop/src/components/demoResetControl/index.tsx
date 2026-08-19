import { useState } from "react";
import Button from "@/components/button";
import Card from "@/components/card";
import Modal from "@/components/Modal";
import toastMessage from "@/utils/common/toastMessage";
import { resetDemoData } from "@/demo/storage/demoStore";
import { Text } from "rsuite";

export default function DemoResetControl() {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleReset = () => {
    resetDemoData();
    toastMessage("success", "Demo data has been reset to its initial state.");
    setConfirmOpen(false);
    window.location.reload();
  };

  return (
    <Card header={<Text className="textBold">Demo data</Text>}>
      <p style={{ color: "var(--text-secondary)", marginBottom: 16 }}>
        This environment uses fictional data stored only in this browser.
        Resetting restores every seeded account, application, appointment and
        log to its original state and discards any changes made during this
        demo session.
      </p>
      <Button
        text="Reset demo data"
        appearance="ghost"
        color="red"
        type="button"
        onClick={() => setConfirmOpen(true)}
      />

      <Modal
        show={confirmOpen}
        handleClose={() => setConfirmOpen(false)}
        title="Reset demo data?"
        description="This cannot be undone. All demo changes made during this session will be discarded."
      >
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            padding: "16px 0",
          }}
        >
          <Button
            text="Cancel"
            appearance="default"
            type="button"
            onClick={() => setConfirmOpen(false)}
          />
          <Button
            text="Reset demo data"
            appearance="primary"
            color="red"
            type="button"
            onClick={handleReset}
          />
        </div>
      </Modal>
    </Card>
  );
}
