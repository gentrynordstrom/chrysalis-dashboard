import {
  TURNOVER_COLUMNS,
  WORK_ORDER_COLUMNS,
  TURNOVER_TYPE_MAP,
} from "./constants";
import type { MondayItem, MondayColumnValue } from "./types";
import type { TurnoverType } from "@/types/database";

interface TurnoverRecord {
  monday_item_id: number;
  unit_name: string | null;
  turnover_type: TurnoverType | null;
  key_turnin_date: string | null;
  deposit_received_date: string | null;
  deposit_status: string | null;
  work_start_date: string | null;
  work_completion_date: string | null;
  is_billed: boolean;
  status: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
}

interface WorkOrderRecord {
  monday_item_id: number;
  tech_rating: number | null;
  quality_rating: number | null;
  assigned_tech: string | null;
  completion_date: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  turnover_monday_item_id: number | null;
}

function getColumnValue(
  item: MondayItem,
  columnId: string
): MondayColumnValue | undefined {
  return item.column_values.find((cv) => cv.id === columnId);
}

function extractText(item: MondayItem, columnId: string): string | null {
  return getColumnValue(item, columnId)?.text ?? null;
}

function extractDate(item: MondayItem, columnId: string): string | null {
  const cv = getColumnValue(item, columnId);
  if (!cv?.value) return null;

  try {
    const parsed = JSON.parse(cv.value);
    return parsed.date ?? null;
  } catch {
    return cv.text ?? null;
  }
}

function extractNumber(item: MondayItem, columnId: string): number | null {
  const text = extractText(item, columnId);
  if (!text) return null;
  const num = parseFloat(text);
  return isNaN(num) ? null : num;
}

function extractRating(item: MondayItem, columnId: string): number | null {
  const cv = getColumnValue(item, columnId);
  if (!cv?.value) return null;

  try {
    const parsed = JSON.parse(cv.value);
    return typeof parsed.rating === "number" ? parsed.rating : null;
  } catch {
    const text = cv.text;
    if (!text) return null;
    const num = parseInt(text, 10);
    return isNaN(num) ? null : num;
  }
}

function extractBoolean(item: MondayItem, columnId: string): boolean {
  const cv = getColumnValue(item, columnId);
  if (!cv?.value) return false;

  try {
    const parsed = JSON.parse(cv.value);
    return parsed.checked === true || parsed.checked === "true";
  } catch {
    const text = cv.text?.toLowerCase() ?? "";
    return text === "true" || text === "yes" || text === "v";
  }
}

function extractStatusLabel(item: MondayItem, columnId: string): string | null {
  const cv = getColumnValue(item, columnId);
  if (!cv?.value) return cv?.text ?? null;

  try {
    const parsed = JSON.parse(cv.value);
    return parsed.label ?? cv.text ?? null;
  } catch {
    return cv.text ?? null;
  }
}

function extractBoardRelationId(
  item: MondayItem,
  columnId: string
): number | null {
  const cv = getColumnValue(item, columnId);
  if (!cv?.value) return null;

  try {
    const parsed = JSON.parse(cv.value);
    const ids = parsed.linkedPulseIds ?? [];
    return ids.length > 0 ? Number(ids[0].linkedPulseId) : null;
  } catch {
    return null;
  }
}

function extractPeopleName(item: MondayItem, columnId: string): string | null {
  const cv = getColumnValue(item, columnId);
  if (!cv) return null;
  return cv.text ?? null;
}

/**
 * Calculates total actual hours from subitems' time tracking columns.
 */
function calculateSubitemsTime(item: MondayItem): number | null {
  if (!item.subitems?.length) return null;

  let totalMinutes = 0;
  let hasAnyTime = false;

  for (const subitem of item.subitems) {
    for (const cv of subitem.column_values) {
      if (
        cv.type === "duration" ||
        cv.id.includes("time_tracking") ||
        cv.id.includes("time7")
      ) {
        if (cv.value) {
          try {
            const parsed = JSON.parse(cv.value);
            const duration =
              parsed.duration ?? parsed.changed_at
                ? parsed.duration
                : null;
            if (typeof duration === "number") {
              totalMinutes += duration;
              hasAnyTime = true;
            }
          } catch {
            if (cv.text) {
              const hours = parseFloat(cv.text);
              if (!isNaN(hours)) {
                totalMinutes += hours * 60;
                hasAnyTime = true;
              }
            }
          }
        }
      }
    }
  }

  return hasAnyTime ? Math.round((totalMinutes / 60) * 100) / 100 : null;
}

export function transformTurnover(item: MondayItem): TurnoverRecord {
  const typeText = extractText(item, TURNOVER_COLUMNS.turnover_type);
  const turnoverType = typeText ? (TURNOVER_TYPE_MAP[typeText] ?? null) : null;

  return {
    monday_item_id: Number(item.id),
    unit_name: item.name,
    turnover_type: turnoverType,
    key_turnin_date: extractDate(item, TURNOVER_COLUMNS.key_turnin_date),
    deposit_received_date: extractDate(
      item,
      TURNOVER_COLUMNS.deposit_received_date
    ),
    deposit_status: extractStatusLabel(item, TURNOVER_COLUMNS.deposit_status),
    work_start_date: extractDate(item, TURNOVER_COLUMNS.turnover_start_date),
    work_completion_date: extractDate(
      item,
      TURNOVER_COLUMNS.work_completion_date
    ),
    is_billed: extractBoolean(item, TURNOVER_COLUMNS.is_billed),
    status: extractStatusLabel(item, TURNOVER_COLUMNS.process_status),
    estimated_hours: null,
    actual_hours: null,
  };
}

export function transformWorkOrder(item: MondayItem): WorkOrderRecord {
  return {
    monday_item_id: Number(item.id),
    tech_rating: extractRating(item, WORK_ORDER_COLUMNS.tech_rating),
    quality_rating: extractRating(item, WORK_ORDER_COLUMNS.quality_rating),
    assigned_tech: extractPeopleName(item, WORK_ORDER_COLUMNS.assigned_tech),
    completion_date: extractDate(item, WORK_ORDER_COLUMNS.completion_date),
    estimated_hours: extractNumber(item, WORK_ORDER_COLUMNS.estimated_hours),
    actual_hours: calculateSubitemsTime(item),
    turnover_monday_item_id: extractBoardRelationId(
      item,
      WORK_ORDER_COLUMNS.turnover_link
    ),
  };
}
