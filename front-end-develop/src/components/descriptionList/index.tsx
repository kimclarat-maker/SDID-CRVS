import React from "react";
import "./styles.css";

export interface DescriptionListProps {
  columns?: 2 | 3 | 4;
  children: React.ReactNode;
}

export const DescriptionList: React.FC<DescriptionListProps> = ({
  columns = 4,
  children,
}) => (
  <dl className={`description-list description-list-cols-${columns}`}>
    {children}
  </dl>
);

export interface DescriptionItemProps {
  label: React.ReactNode;
  value?: React.ReactNode;
  testId?: string;
}

export const DescriptionItem: React.FC<DescriptionItemProps> = ({
  label,
  value,
  testId,
}) => {
  const isEmpty = value === undefined || value === null || value === "";

  return (
    <div className="description-item" data-testid={testId}>
      <dt>{label}</dt>
      <dd>{isEmpty ? "-" : value}</dd>
    </div>
  );
};

export default DescriptionList;
