import "./styles.css";
import { Text } from "rsuite";

const GuideContent = ({
  title,
  description,
  count,
  imageUrl,
}: {
  title: string;
  description: string;
  count: number;
  imageUrl: any;
}) => {
  return (
    <div>
      <div className="card-body">
        <div className="mb-3">
          <Text className="textBold">
            {count}. {title}
          </Text>
          {description && <Text>{description}</Text>}
          <div className="tuto-image">
            <img src={imageUrl} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuideContent;
