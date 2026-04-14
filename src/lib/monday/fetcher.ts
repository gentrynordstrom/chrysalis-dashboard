import { mondayQuery } from "./client";
import { buildTurnoverQuery, buildWorkOrderQuery } from "./queries";
import type { MondayBoardsResponse, MondayItem } from "./types";

interface FetchOptions {
  maxPages?: number;
}

async function fetchAllItems(
  buildQuery: (cursor?: string) => {
    query: string;
    variables: Record<string, unknown>;
  },
  options: FetchOptions = {}
): Promise<MondayItem[]> {
  const allItems: MondayItem[] = [];
  let cursor: string | undefined;
  let pageCount = 0;

  do {
    const { query, variables } = buildQuery(cursor);
    const data = await mondayQuery<MondayBoardsResponse>(query, variables);

    const page = data.boards[0]?.items_page;
    if (!page) break;

    allItems.push(...page.items);
    cursor = page.cursor ?? undefined;
    pageCount++;

    if (options.maxPages && pageCount >= options.maxPages) {
      console.log(
        `Reached max pages (${options.maxPages}), fetched ${allItems.length} items so far`
      );
      break;
    }
  } while (cursor);

  return allItems;
}

export async function fetchAllTurnovers(
  options?: FetchOptions
): Promise<MondayItem[]> {
  return fetchAllItems(buildTurnoverQuery, options);
}

export async function fetchAllWorkOrders(
  options?: FetchOptions
): Promise<MondayItem[]> {
  return fetchAllItems(buildWorkOrderQuery, options);
}
