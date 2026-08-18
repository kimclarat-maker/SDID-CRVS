import { ListItemType } from "@/types/List/ListItem";
import "./styles.css";

const ListItem = ({ children }: ListItemType) => {
  return <div className="list-item">{children}</div>;
};

export default ListItem;
