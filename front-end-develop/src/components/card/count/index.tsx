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
      style={{ ["--accent-color" as string]: color, cursor: "pointer" }}
    >
      <div className="card " onClick={onClick}>
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
