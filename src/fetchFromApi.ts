import axios, { AxiosError } from "axios";
import { API_URL } from "./consts";
import type { ApiParams, ApiTransaction } from "./types";

export const fetchFromApi = async (
  params: ApiParams,
): Promise<ApiTransaction[]> => {
  // Make a request using your favorite HTTP client
  try {
    const response = await axios(`${API_URL}/x-transfers`, {
      method: "POST",
      data: params,
    });

    return response.data as ApiTransaction[];
  } catch (error) {
    // Handle errors
    if (error instanceof AxiosError) {
      console.error(error);
      let errorMessage = "Error while fetching data.";
      if (error.response === undefined) {
        errorMessage += " Couldn't connect to API.";
      } else {
        const data = error.response.data as { message?: unknown };
        const rawMessage = data?.message;
        const serverMessage = rawMessage
          ? " Server response: " +
            (typeof rawMessage === "string"
              ? rawMessage
              : JSON.stringify(rawMessage))
          : "";
        errorMessage += serverMessage;
      }
      throw new Error(errorMessage, { cause: error });
    } else if (error instanceof Error) {
      console.error(error);
      throw new Error(error.message, { cause: error });
    } else {
      throw new Error("An unknown error occurred", { cause: error });
    }
  }
};
