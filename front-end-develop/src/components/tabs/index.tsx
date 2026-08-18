import { useEffect, useState } from "react";
import { Tabs, Tab } from "react-bootstrap";
import "./style.css";

const CustomTabs = (props: any) => {
  const [key, setKey] = useState(
    props.key
      ? props.key
      : props.options.length > 0
      ? props.options[0]?.title?.toLowerCase()
      : undefined
  );

  useEffect(() => {
    if (props.activeTab) {
      setKey(props.activeTab);
    }
    props.getTab && props.getTab(props.activeTab);
  }, [props.activeTab]);
  return (
    <>
      <Tabs
        id="controlled-tab-example"
        activeKey={key}
        onSelect={(k) => {
          // if (props.navigationDisabled) return;
          !props.navigationDisabled && setKey(k);
          props.getTab && props.getTab(k);
        }}
        className={`tab gap-3 flex-nowrap ${props.className}`}
        style={props.styles}
      >
        {props.options.map((item: any, i: number) => {
          return (
            <Tab
              key={i}
              eventKey={item?.key || item?.title?.toLowerCase()}
              title={item.title}
            >
              <div style={{ position: "relative" }}>{item.data}</div>
            </Tab>
          );
        })}
      </Tabs>
    </>
  );
};

export default CustomTabs;
