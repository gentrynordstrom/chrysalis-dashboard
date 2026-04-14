export interface MondayColumnValue {
  id: string;
  type: string;
  text: string | null;
  value: string | null;
}

export interface MondaySubitem {
  id: string;
  name: string;
  column_values: MondayColumnValue[];
}

export interface MondayItem {
  id: string;
  name: string;
  column_values: MondayColumnValue[];
  subitems?: MondaySubitem[];
}

export interface MondayItemsPage {
  cursor: string | null;
  items: MondayItem[];
}

export interface MondayBoardsResponse {
  boards: Array<{
    items_page: MondayItemsPage;
  }>;
}
