import { List } from "rsuite";

const Sidebar = ({ menus }: { menus: any[] }) => {
  return (
    <div className="user-guide-table-content-container">
      <div className="user-guide-table-content">
        {menus &&
          menus?.map((value: any, index: number) => {
            return (
              <List.Item
                onClick={() =>
                  (window.location.href = `#${value?.title.replaceAll(
                    " ",
                    "_"
                  )}`)
                }
                key={index}
              >
                {value?.title}
              </List.Item>
            );
          })}
      </div>
    </div>
  );
};

export default Sidebar;
