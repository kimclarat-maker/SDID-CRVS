import React from "react";
import { DashboardHeader } from "../Header";
import { connect } from "react-redux";
import GuideContent from "./GuideContent";
import { ListItem } from "../List";
import { withRouter } from "../../utils/withRouter";
import { fetchUserGuide } from "../../utils/queries/userGuideQuery";
import { Loading } from "../Loader";
import { getStorage } from "../../utils/storage";
import { Empty } from "../Empty";
import icons from "../../constants/icons";
import Sidebar from "./Sidebar";
import UserGuideData from "./UserGuideData";

class UserGuide extends React.Component {
  state = {
    isLoading: false,
    data: {},
    user: {},
  };

  componentDidMount = async () => {
    const user = await getStorage();

    this.setState({ user });

    this.getData(true);
  };

  getData = async (isLoading) => {
    try {
      this.setState({ isLoading });

      const data = await fetchUserGuide(this.props.defaultLanguage);

      this.setState({ isLoading: false, data });
    } catch (error) {
      this.setState({ isLoading: false });
    }
  };
  render() {
    const { data } = this.state;
    return (
      <>
        <div className="row">
          <div className="col-md-8">
            <UserGuideData
              headerTitle="PSRP ADMINISTRATOR - User Guide"
              headerDescription="Welcome to PSRP User Guide"
              data={data}
            />
          </div>
          <div className="col-md-4" style={{ position: "relative" }}>
            <Sidebar data={data} />
          </div>
        </div>
      </>
    );
  }
}

const mapStateToProps = (state) => {
  const { defaultLanguage } = state.Language;
  return {
    defaultLanguage,
  };
};

export default connect(mapStateToProps)(withRouter(UserGuide));
