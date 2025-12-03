import axios, { AxiosError } from "axios";
import { API_URL } from "./consts";

// Define the type for the API parameters 📦
export type ApiParams = {
  from?: string;
  to?: string;
  currency: {
    symbol: string;
    amount: string;
  };
  address: string;
  senderAddress: string;
};

export const fetchFromApi = async (
  params: ApiParams
): Promise<string | undefined> => {
  // Make a request using your favorite HTTP client
  try {
    const response = await axios(`${API_URL}/x-transfer`, {
      method: "POST",
      data: params,
    });

    return (await response.data) as string;
  } catch (error) {
    // Handle errors
    if (error instanceof AxiosError) {
      console.error(error);
      let errorMessage = "Error while fetching data.";
      if (error.response === undefined) {
        errorMessage += " Couldn't connect to API.";
      } else {
        const serverMessage =
          error.response.data &&
          (error.response.data as { message: string }).message
            ? " Server response: " +
              (error.response.data as { message: string }).message
            : "";
        errorMessage += serverMessage;
      }
      throw new Error(errorMessage);
    } else if (error instanceof Error) {
      console.error(error);
      throw new Error(error.message);
    }
  }
};
