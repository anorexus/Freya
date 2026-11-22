export const TX_TYPES = ["INCOME", "EXPENSE", "TRANSFER"] as const;

export type TxType = (typeof TX_TYPES)[number];

/** A Transactions-tab row as stored. Amount and type stay raw so dirty cells survive a round trip. */
export type StoredRow = {
  transaction_id: string;
  date: string;
  type: string;
  amount: string;
  category_l1: string;
  category_l2: string;
  item_name: string;
  notes: string;
  wallet_id: string;
  beneficiary: string;
};

export type RawRow = StoredRow & {
  rowNumber: number;
};

export type ParsedRow = {
  rowNumber: number;
  transactionId: string;
  date: string;
  type: TxType;
  amount: number;
  categoryL1: string;
  categoryL2: string;
  itemName: string;
  notes: string;
  walletId: string;
  beneficiary: string;
};

export type RowIssue = {
  rowNumber: number;
  reasons: string[];
};

export type Receipt = {
  transactionId: string;
  date: string;
  type: TxType;
  notes: string;
  lines: ParsedRow[];
  total: number;
  categories: string[];
};

export type NewLine = {
  amount: number;
  categoryL1: string;
  categoryL2: string;
  itemName: string;
};

export type NewTransaction = {
  date: string;
  type: "INCOME" | "EXPENSE";
  notes: string;
  lines: NewLine[];
};
