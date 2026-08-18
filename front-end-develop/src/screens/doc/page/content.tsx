import { userGuideData } from "@/constants/user-guide";
import { Heading, Text } from "rsuite";
import "./styles.css";
import Card from "@/components/card";
import { Link, useParams } from "react-router-dom";
import Icon from "@/components/icon";

function Documentation() {
  const params = useParams();

  const defaultName = params.q || Object.keys(userGuideData)[0];

  return (
    <div className="container" style={{ marginTop: "2rem" }}>
      <div className="row">
        <div className="col-md-8">
          {userGuideData &&
            userGuideData[defaultName]?.map((el: any, i: number) => {
              return (
                <div className="card" key={i}>
                  <div className="card-header" style={{ paddingTop: "1.5rem" }}>
                    <Heading level={4} className="textPrimary textBold">
                      {defaultName}
                    </Heading>
                  </div>
                  <hr />
                  <div
                    className="card-body"
                    style={{
                      height: "90vh",
                      overflowY: "auto",
                      paddingBottom: "2rem",
                    }}
                  >
                    {el.description && (
                      <Text className="mb-3">{el.description}</Text>
                    )}
                    {el.data.map((item: any, n: number) => {
                      return (
                        <>
                          <div className="mb-3">
                            <Text className="textBold">
                              {n + 1}. {item.title}
                            </Text>
                            {item.description && (
                              <Text>{item.description}</Text>
                            )}
                            <div className="tuto-image">
                              <img src={item.imageUrl} />
                            </div>
                          </div>
                        </>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
        <div className="col-md-4">
          <Card>
            <div
              style={{
                height: "95vh",
                overflowY: "auto",
              }}
            >
              {Object.keys(userGuideData).map((el: any, i: number) => {
                return (
                  <div className="doc-item-link" key={i}>
                    <Icon name="description" />
                    <Link to={`/doc/admin/content/${el}`}>{el}</Link>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Documentation;
