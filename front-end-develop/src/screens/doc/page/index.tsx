import "./styles.css";
import FormLayout from "@/layout/form/formLayout";
import searchImage from "@/assets/search vector.png";
import { userGuideData } from "@/constants/user-guide";
import { Link } from "react-router-dom";

function Page() {
  return (
    <FormLayout
      title="{translation.search_application}"
      description="{translation.search_application_description}"
      size={8}
      image={searchImage}
      headerStyle={{ flexDirection: "column", alignItems: "flex-start" }}
    >
      {Object.keys(userGuideData).map((el: any, i: number) => {
        return (
          <div className="item-link" key={i}>
            <Link to={`/doc/admin/content/${el}`}>{el}</Link>
          </div>
        );
      })}
    </FormLayout>
  );
}

export default Page;
