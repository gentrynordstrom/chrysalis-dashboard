import { mondayQuery } from "./client";
import { buildTurnoverQuery, buildWorkOrderQuery } from "./queries";
import type { MondayBoardsResponse, MondayItem } from "./types";

/**
 * Fetches all items from a Monday.com board, handling cursor-based pagination.
 */
async function fetchAllItems(
  buildQuery: (cursor?: string) => { query: string; variables: Record<string, unknown> }
): Promise<MondayItem[]> {
  const allItems: MondayItem[] = [];
  let cursor: string | undefined;

  do {
    const { query, variables } = buildQuery(cursor);
    const data = await mondayQuery<MondayBoardsResponse>(query, variables);

    const page = data.boards[0]?.items_page;
    if (!page) break;

    allItems.push(...page.items);
    cursor = page.cursor ?? undefined;
  } while (cursor);

  return allItems;
}

export async function fetchAllTurnovers(): Promise<MondayItem[]> {
  return fetchAllItems(buildTurnoverQuery);
}

export async function fetchAllWorkOrders(): Promise<MondayItem[]> {
  return fetchAllItems(buildWorkOrderQuery);
}
