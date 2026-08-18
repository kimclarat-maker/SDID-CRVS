import { getStorage } from "../storage";

export const defineRole = async () => {
  const userData = await getStorage();

  let center;

  if (
    userData &&
    userData.account &&
    userData.account.center &&
    userData.account.center._id
  ) {
    center = [userData.account.center];
  }

  return {
    center,
  };
};
