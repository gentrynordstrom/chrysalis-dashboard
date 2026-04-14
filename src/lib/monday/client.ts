import { MONDAY_API_URL } from "./constants";

interface MondayResponse<T = unknown> {
  data?: T;
  errors?: Array<{ message: string }>;
  error_message?: string;
}

export async function mondayQuery<T = unknown>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const token = process.env.MONDAY_API_TOKEN;
  if (!token) {
    throw new Error("MONDAY_API_TOKEN is not configured");
  }

  const response = await fetch(MONDAY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
      "API-Version": "2024-10",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(
      `Monday.com API error: ${response.status} ${response.statusText}`
    );
  }

  const result: MondayResponse<T> = await response.json();

  if (result.errors?.length) {
    throw new Error(
      `Monday.com GraphQL errors: ${result.errors.map((e) => e.message).join(", ")}`
    );
  }

  if (result.error_message) {
    throw new Error(`Monday.com API error: ${result.error_message}`);
  }

  return result.data as T;
}
