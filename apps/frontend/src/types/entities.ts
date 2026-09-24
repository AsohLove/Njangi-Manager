export type registerDto = {
  email: string;
  password: string;
  full_name: string;
};

export type loginDto = {
  email: string;
  password: string;
};

export type groupDto = {
  name: string;
  amount: number;
  frequency: string;
  start_date: string;
  order_mode: "fixed" | "ballot";
};

export type GroupProps = {
  id: number;
  ownerId: number;
  name: string;
  amount: number;
  frequency: string;
  startDate: string;
  orderMode: string;
  shareCode: string;
  createdAt: string;
  currentRoundNumber: number;
  collectorName: string;
  collectorPositionId: number;
  paidCount: number;
  totalMembers: number;
  totalPositions: number;
};

export type SelectionMethod = "auto" | "app_draw" | "manual_draw";
export type CycleStatus = "active" | "complete";
export type PayoutStatus = "COLLECTED" | "THIS ROUND" | null;
export type PaymentStatus = "PAID" | "PARTLY" | "WAITING";

export interface Member {
  id: number;
  groupId: number;
  fullName: string;
  phone: string | null;
}

export interface Position {
  id: number;
  memberId: number;
  memberName: string;
  rotationOrder: number | null;
  payoutOrder: number | null;
  isActive: boolean;
  positionLabel: string | null; // e.g., "position 1 of 2"
  payoutStatus: PayoutStatus; // "COLLECTED" | "THIS ROUND" | null
  paymentStatus: PaymentStatus; // "PAID" | "PARTLY" | "WAITING"
  amountPaid: number;
  isLate: boolean;
}

export interface ActiveCycle {
  id: number;
  number: number;
  status: CycleStatus;
  startedAt: string;
}

export interface RoundPayment {
  id: number;
  positionId: number;
  memberName: string | null;
  amount: number;
  isLate: boolean;
  paidAt: string;
}

export interface Payout {
  id: number;
  roundId: number;
  positionId: number;
  amount: number;
  shortfall: number;
  paidAt: string;
}

export interface OpenRoundSummary {
  id: number;
  number: number;
  dueDate: string;
  selectionMethod: SelectionMethod;
  collectorPositionId: number;
  collectorName: string | null;
  collectorRotationOrder: number | null;
  targetAmount: number;
  collectedAmount: number;
  paidCount: number;
  payments: RoundPayment[];
  payout: Payout | null;
}

export interface RoundPositionStatus {
  position_id: number;
  member_id: number;
  member_name: string;
  expected: number;
  paid: number;
  status: "waiting" | "partly_paid" | "paid";
  is_late: boolean;
}

export interface RoundDetails {
  id: number;
  cycle_id: number;
  number: number;
  collector_position_id: number;
  collector: {
    position_id: number;
    member_id: number;
    member_name: string;
  };
  selection_method: SelectionMethod;
  due_date: string;
  status: "open" | "closed";
  expected_amount: number;
  collected_amount: number;
  positions: RoundPositionStatus[];
  opened_at: string;
  closed_at: string | null;
}

export interface GroupDetailResponse {
  id: number;
  ownerId: number;
  name: string;
  amount: number;
  frequency: string;
  startDate: string;
  orderMode: string;
  shareCode: string;
  createdAt: string;
  fundBalance: number;
  totalMembers: number;
  totalPositions: number;
  members: Member[];
  positions: Position[];
  activeCycle: ActiveCycle | null;
  openRound: OpenRoundSummary | null;
}

export interface Payment {
  position_id: number;
  amount?: number;
}

export interface UpdatePayment {
  amount: number;
}

export interface ShareCollector {
  position_id: number;
  member_id: number;
  member_name: string;
  rotation_order: number;
  target_amount: number;
  collected_amount: number;
}
export type ShareRoundStatus = 'paid' | 'partly' | 'waiting' | 'no_open_round';

export interface SharePosition {
  position_id: number;
  rotation_order: number;
  member_id: number;
  member_name: string;
  position_label: string | null;
  round_status: ShareRoundStatus;
  paid_amount: number;
  is_late: boolean;
}

export interface ShareCurrentRound {
  id: number;
  number: number;
  status: string;
  due_date: string;
  collector: ShareCollector;
  positions: SharePosition[];
}

export interface ShareFine {
  id: number;
  member_id: number;
  member_name: string;
  rule_name: string;
  amount: number;
  status: string;
}
export interface FineRule {
  id: number;
  name: string;
  defaultAmount?: number;
  default_amount?: number;
}

export type FineStatus = "owed" | "paid";

export interface Fine {
  id: number;
  member_id: number;
  member_name: string;
  rule_id: number;
  rule_name: string;
  round_id: number | null;
  amount: number;
  note: string | null;
  status: FineStatus;
  applied_at: string;
  paid_at: string | null;
}

export interface FineListResponse {
  items: Fine[];
  next: number | null;
}

export interface ShareGroupResponse {
  name: string;
  amount: number;
  frequency: string;
  total_rounds: number;
  fund_balance: number;
  fund_source_note: string;
  current_round: ShareCurrentRound | null;
  fines: ShareFine[];
}

export interface Rule {
  name: string,
  default_amount: number,
}

export type LedgerType = "payment" | "payout" | "fine" | "spending" | "adjustment";
export type FilterKey = "all" | "payment" | "payout" | "fine" | "funds";

export interface LedgerEntry {
  id: number;
  type: LedgerType;
  amount: number;
  member_id: number | null;
  member_name: string | null;
  round_id: number | null;
  round_number?: number | null;
  position_id?: number;
  position_order?: number | null;
  label?: string;
  rule_name?: string;
  note?: string | null;
  status?: string;
  created_at: string;
}