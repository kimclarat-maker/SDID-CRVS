import { Route, Routes, Outlet } from "react-router-dom";
import Drafts from "./drafts";
import Pending from "./pending";
import Approved from "./approved";
import Rejected from "./rejected";
import RollBacks from "./rollBacks";
import useCurrentPath from "@/hooks/useCurrentPath";
import { NavigationType } from "@/types/Navigation";
import SingleRollBack from "./rollBacks/single";
import SingleDraft from "./drafts/single";
import SingleRejected from "./rejected/single";
import PrenrollmentSkip from "./exceptions/prenrollment/prenrollmentSkip";
import ApproverSkip from "./exceptions/approver/approverSkip";
import Exceptions from "./exceptions";
import Offline from "./offline";

export const routes: NavigationType[] = [
  {
    path: "/drafts",
    element: <Drafts />,
  },
  {
    path: "/draft/:id",
    element: <SingleDraft />,
  },
  {
    path: "/pending",
    element: <Pending />,
  },
  {
    path: "/offline",
    element: <Offline />,
  },
  {
    path: "/exceptions",
    element: <Exceptions />,
  },
  {
    path: "/exceptions/approver/:enrollmentId/:accountId",
    element: <ApproverSkip />,
  },
  {
    path: "/exceptions/approver/refresh/:enrollmentId/:accountId",
    element: <ApproverSkip isBioRefresh />,
  },
  {
    path: "/exceptions/prenrollment/:prenrollmentNo",
    element: <PrenrollmentSkip />,
  },
  {
    path: "/approved",
    element: <Approved />,
  },
  {
    path: "/rejected",
    element: <Rejected />,
  },
  {
    path: "/rejected/:id",
    element: <SingleRejected />,
  },
  {
    path: "/roll_backs",
    element: <RollBacks />,
  },
  {
    path: "/roll_backs/:id",
    element: <SingleRollBack />,
  },
];

export default () => {
  const PATH = useCurrentPath();

  if (!PATH.exist) return <></>;

  return (
    <>
      <Routes>
        {routes.map((route, index) => (
          <Route key={index} path={route.path} element={route.element} />
        ))}
      </Routes>
      <Outlet />
    </>
  );
};
