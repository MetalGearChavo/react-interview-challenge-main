import { query } from "../utils/db";
import { getAccount } from "./accountHandler";

const DAILY_WITHDRAW_LIMIT = 400;

const isSameDay = (dateA?: Date | string | null, dateB?: Date): boolean => {
  if (!dateA || !dateB) return false;

  const a = new Date(dateA).toISOString().slice(0, 10);
  const b = dateB.toISOString().slice(0, 10);

  return a === b;
};

export const withdrawal = async (accountID: string, amount: number) => {
  const account = await getAccount(accountID);
  const today = new Date();

  // Resetear contador si es un día distinto
  if (!isSameDay(account.withdrawn_day, today)) {
    account.withdrawn_today = 0;
    account.withdrawn_day = today;
  }

  const projectedTotal = account.withdrawn_today + amount;

  // Validar límite diario
  if (projectedTotal > DAILY_WITHDRAW_LIMIT) {
    return account;
  }

  // Actualizar montos en memoria
  account.withdrawn_today = projectedTotal;
  account.amount -= amount;

  const res = await query(
    `
    UPDATE accounts
    SET amount = $1,
        withdrawn_today = $3,
        withdrawn_day = $4
    WHERE account_number = $2
    `,
    [account.amount, accountID, account.withdrawn_today, account.withdrawn_day]
  );

  if (res.rowCount === 0) {
    throw new Error("Transaction failed");
  }

  console.log(account);
  return account;
};

export const deposit = async (accountID: string, amount: number) => {
  const account = await getAccount(accountID);
  account.amount += amount;
  const res = await query(
    `
    UPDATE accounts
    SET amount = $1 
    WHERE account_number = $2`,
    [account.amount, accountID]
  );

  if (res.rowCount === 0) {
    throw new Error("Transaction failed");
  }

  return account;
};
