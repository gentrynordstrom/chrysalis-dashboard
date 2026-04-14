export const MONDAY_API_URL = "https://api.monday.com/v2";

export const BOARD_IDS = {
  TURNOVER: "7288152041",
  WORK_ORDER: "6757182593",
} as const;

/**
 * Turnover Board (7288152041) column mappings.
 * Keys are our internal names; values are Monday.com column IDs.
 */
export const TURNOVER_COLUMNS = {
  turnover_type: "color_mkypv2y8",
  key_turnin_date: "date5__1",
  deposit_received_date: "date64__1",
  turnover_start_date: "date4__1",
  work_completion_date: "date96__1",
  process_status: "status1__1",
  deposit_status: "status_1__1",
  unit_link: "board_relation_mkwa2cvj",
  is_billed: "boolean_mm2dyvjk",
} as const;

/**
 * Work Order Board (6757182593) column mappings.
 */
export const WORK_ORDER_COLUMNS = {
  tech_rating: "rating__1",
  quality_rating: "rating_2__1",
  review_comment: "long_text4__1",
  bill_created_date: "date_mkttd013",
  estimated_hours: "numeric_mkqgs9kp",
  actual_hours: "subitems_total_time7__1",
  completion_date: "date_closed1__1",
  assigned_tech: "people3__1",
  turnover_link: "board_relation_mm096qmr",
} as const;

/** Maps Monday.com color/label values to our turnover_type enum. */
export const TURNOVER_TYPE_MAP: Record<string, "light" | "medium" | "heavy"> = {
  Light: "light",
  light: "light",
  Medium: "medium",
  medium: "medium",
  Heavy: "heavy",
  heavy: "heavy",
};
