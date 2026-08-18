import React from "react";

interface Props {
  xml: string;
}

const WorkflowPreview: React.FC<Props> = ({ xml }) => {
  if (!xml) return null;

  return (
    <pre
      style={{
        background: "var(--surface-subtle)",
        border: "1px solid var(--border-default)",
        borderRadius: "var(--radius-md)",
        color: "var(--text-primary)",
        padding: "1rem",
        marginTop: "1rem",
        maxHeight: "300px",
        overflow: "auto",
        whiteSpace: "pre-wrap",
      }}
    >
      {xml}
    </pre>
  );
};

export default WorkflowPreview;
