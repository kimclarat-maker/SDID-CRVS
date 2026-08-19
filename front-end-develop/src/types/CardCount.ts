export type CardCountType = {
  color?: string;
  onClick?: () => void;
  count: number;
  loading?: boolean;
  icon?: string;
  name: string;
  trend?: { value: string; direction: "up" | "down" };
};
