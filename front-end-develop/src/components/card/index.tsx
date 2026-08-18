import { CardType } from "@/types/Card";
import "./styles.css";

export default function Card({ children, styles, header }: CardType) {
  return (
    <div className="card" style={styles}>
      {header && (
        <div
          className="card-header"
          style={{
            minHeight: "1rem",
            backgroundColor: "var(--bg-color) !important",
          }}
        >
          {header}
        </div>
      )}
      <div className="card-body">{children}</div>
    </div>
  );
}
