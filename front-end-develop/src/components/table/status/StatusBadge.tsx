import React from "react";
import { getStatusVariant } from "@/utils/common/statusVariant";
import "./styles.css";

interface StatusBadgeProps {
  label: string;
  status?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  status,
}) => {
  const variant = getStatusVariant(status ?? label);

  return <span className={`status-badge status-badge-${variant}`}>{label}</span>;
};

export default StatusBadge;
