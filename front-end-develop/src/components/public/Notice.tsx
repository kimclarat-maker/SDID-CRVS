import Icon from "@/components/icon";

type NoticeType = "info" | "warning" | "success" | "danger";

const ICONS: Record<NoticeType, string> = {
  info: "info",
  warning: "warning",
  success: "check_circle",
  danger: "error",
};

export default function Notice({
  type = "info",
  title,
  children,
}: {
  type?: NoticeType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`public-notice public-notice-${type}`} role="status">
      <Icon name={ICONS[type]} />
      <div>
        <strong>{title}</strong>
        <span>{children}</span>
      </div>
    </div>
  );
}
