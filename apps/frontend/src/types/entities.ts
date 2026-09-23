export type registerDto = {
  email: string,
  password: string,
  full_name: string,
}

export type loginDto = {
  email: string,
  password: string
}

export type groupDto = {
  name: string,
  amount: number,
  frequency: string,
  start_date: string,
  order_mode: "fixed" | "ballot"
}

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
  // Optional parameters if present in your API response
  status?: string;
  totalPositions?: number;
  collectedPositions?: number;
}

export type MemberProps = {
  id: number;
  groupId: number;
  userId: number;
  fullName: string;
  phone?: string | null;
}

export type PositionProps = {
  id: number;
  groupId: number;
  memberId: number;
  rotationOrder: number | null;
  isActive: boolean;
}

export type GroupMemberProps = MemberProps & {
  position: PositionProps[];
}