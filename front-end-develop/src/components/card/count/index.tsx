import { CardCountType } from "@/types/CardCount";
import "./styles.css";
import Icon from "@/components/icon";
import TitleLoader from "@/components/loader/barLoader/Title";
import { Heading, Text } from "rsuite";

const CardCount: React.FC<CardCountType> = ({
  color,
  count,
  onClick,
  icon,
  loading,
  name,
}) => {
  return (
    <div
      className="card-count-container"
      style={{ ["--accent-color" as string]: color, cursor: onClick ? "pointer" : "default" }}
    >
      <div className="card " onClick={onClick} role={onClick ? "button" : undefined} tabIndex={onClick ? 0 : undefined}>
        <div className="card-body">
          {icon && (
            <div className="card-count-icon-container">
              <Icon name={icon} />
            </div>
          )}

          <div className="card-count-content">
            {loading ? (
              <TitleLoader />
            ) : (
              <>
                <Heading level={3} className="count">
                  {count}
                </Heading>
                <Text>{name}</Text>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardCount;
