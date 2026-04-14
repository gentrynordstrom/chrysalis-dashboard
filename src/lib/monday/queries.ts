import { BOARD_IDS, TURNOVER_COLUMNS, WORK_ORDER_COLUMNS } from "./constants";

const turnoverColumnIds = Object.values(TURNOVER_COLUMNS);
const workOrderColumnIds = Object.values(WORK_ORDER_COLUMNS);

/**
 * Fetches all items from the Turnover Board, paginated.
 * Monday.com API v2 uses items_page for cursor-based pagination.
 */
export function buildTurnoverQuery(cursor?: string) {
  if (cursor) {
    return {
      query: `query ($boardId: [ID!]!, $cursor: String!) {
        boards(ids: $boardId) {
          items_page(limit: 100, cursor: $cursor) {
            cursor
            items {
              id
              name
              column_values(ids: ${JSON.stringify(turnoverColumnIds)}) {
                id
                type
                text
                value
              }
            }
          }
        }
      }`,
      variables: { boardId: [BOARD_IDS.TURNOVER], cursor },
    };
  }

  return {
    query: `query ($boardId: [ID!]!) {
      boards(ids: $boardId) {
        items_page(limit: 100) {
          cursor
          items {
            id
            name
            column_values(ids: ${JSON.stringify(turnoverColumnIds)}) {
              id
              type
              text
              value
            }
          }
        }
      }
    }`,
    variables: { boardId: [BOARD_IDS.TURNOVER] },
  };
}

/**
 * Fetches all items from the Work Order Board, paginated.
 * Includes subitems query for actual hours data.
 */
export function buildWorkOrderQuery(cursor?: string) {
  if (cursor) {
    return {
      query: `query ($boardId: [ID!]!, $cursor: String!) {
        boards(ids: $boardId) {
          items_page(limit: 25, cursor: $cursor) {
            cursor
            items {
              id
              name
              column_values(ids: ${JSON.stringify(workOrderColumnIds)}) {
                id
                type
                text
                value
              }
              subitems {
                id
                name
                column_values {
                  id
                  type
                  text
                  value
                }
              }
            }
          }
        }
      }`,
      variables: { boardId: [BOARD_IDS.WORK_ORDER], cursor },
    };
  }

  return {
    query: `query ($boardId: [ID!]!) {
      boards(ids: $boardId) {
        items_page(limit: 25) {
          cursor
          items {
            id
            name
            column_values(ids: ${JSON.stringify(workOrderColumnIds)}) {
              id
              type
              text
              value
            }
            subitems {
              id
              name
              column_values {
                id
                type
                text
                value
              }
            }
          }
        }
      }
    }`,
    variables: { boardId: [BOARD_IDS.WORK_ORDER] },
  };
}
