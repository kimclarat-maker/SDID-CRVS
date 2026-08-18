import { jwtDecode } from "jwt-decode";

interface TokenPayload {
  exp: number;
}

interface UserPayload {
  user: string;
}

export const isTokenExpired = (token: string): boolean => {
  try {
    const { exp } = jwtDecode<TokenPayload>(token);
    if (!exp) return true;
    const currentTime = Math.floor(Date.now() / 1000);
    return exp < currentTime;
  } catch (error) {
    return true;
  }
};

export const userEmail = (token: string): string => {
  try {
    const { user } = jwtDecode<UserPayload>(token);
    return user;
  } catch (error) {
    return "";
  }
};
