import API from "./api";

export const getCurrentUser = async () => {

    const response = await API.get("/api/users/me");

    return response.data;

};