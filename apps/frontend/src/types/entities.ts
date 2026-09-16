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