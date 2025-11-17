import React, { useState } from "react";
import { account } from "../Types/Account";
import Paper from "@mui/material/Paper/Paper";
import { Button, Card, CardContent, Grid, TextField } from "@mui/material";

type AccountDashboardProps = {
  account: account;
  signOut: () => Promise<void>;
};

export const AccountDashboard = (props: AccountDashboardProps) => {
  const [depositAmount, setDepositAmount] = useState(0);
  const [withdrawAmount, setWithdrawAmount] = useState(0);
  const [account, setAccount] = useState(props.account);
  const [errorState, setErrorState] = useState({
    singleTransactionLimit: false,
    moduloFiveBills: false,
    negativeWithdrawal: false,
    checkingWithdrawLimit: false,
    creditWithdrawLimit: false,
    dailyWithdrawAmount: false,
    negativeDeposit: false,
    depositLimit: false,
    creditDepositLimit: false,
  });

  const { signOut } = props;

  type ErrorKey =
    | "singleTransactionLimit"
    | "moduloFiveBills"
    | "negativeWithdrawal"
    | "checkingWithdrawLimit"
    | "creditWithdrawLimit"
    | "dailyWithdrawAmount"
    | "negativeDeposit"
    | "depositLimit"
    | "creditDepositLimit";
  const setErrors = (errors: Array<ErrorKey>) => {
    const newErrors: Record<ErrorKey, boolean> = {
      singleTransactionLimit: false,
      moduloFiveBills: false,
      negativeWithdrawal: false,
      checkingWithdrawLimit: false,
      creditWithdrawLimit: false,
      dailyWithdrawAmount: false,
      negativeDeposit: false,
      depositLimit: false,
      creditDepositLimit: false,
    };
    errors.forEach((error) => {
      newErrors[error] = true;
    });
    setErrorState(newErrors);
  };

  const handleOnChangeWithdrawal = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (e.target.name === "withdrawAmount") {
      setErrorState((prev) => ({
        ...prev,
        singleTransactionLimit: false,
        moduloFiveBills: false,
        negativeWithdrawal: false,
        checkingWithdrawLimit: false,
        creditWithdrawLimit: false,
        dailyWithdrawAmount: false,
        negativeDeposit: false,
        depositLimit: false,
        creditDepositLimit: false,
      }));
    }
    setWithdrawAmount(+e.target.value);
  };

  const handleOnChangeDeposit = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (e.target.name === "depositAmount") {
      setErrorState((prev) => ({
        ...prev,
        depositLimit: false,
        creditDepositLimit: false,
        negativeDeposit: false,
      }));
    }
    setDepositAmount(+e.target.value);
  };

  const validateDeposit = () => {
    const errors: ErrorKey[] = [];

    if (depositAmount <= 0) {
      errors.push("negativeDeposit");
    }

    if (depositAmount > 1000) {
      errors.push("depositLimit");
    }

    if (account.type === "credit") {
      let proyectedAmount = account.amount + depositAmount;
      if (proyectedAmount > 0) {
        errors.push("creditDepositLimit");
      }
    }

    return errors;
  };

  const depositFunds = async () => {
    const errors = validateDeposit();

    if (errors.length > 0) {
      setErrors(errors);
      return;
    }
    const requestOptions = {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: depositAmount }),
    };

    const response = await fetch(
      `http://localhost:3000/transactions/${account.accountNumber}/deposit`,
      requestOptions
    );
    const data = await response.json();
    setAccount({
      accountNumber: data.account_number,
      name: data.name,
      amount: data.amount,
      type: data.type,
      creditLimit: data.credit_limit,
      withdrawn_today: data.withdrawn_today,
    });
  };

  const validateWithdraw = () => {
    const errors: ErrorKey[] = [];

    if (withdrawAmount <= 0) {
      errors.push("negativeWithdrawal");
    }

    if (withdrawAmount > 200) {
      errors.push("singleTransactionLimit");
    }

    if (withdrawAmount % 5 !== 0) {
      errors.push("moduloFiveBills");
    }

    const projectedTotal = account.withdrawn_today + withdrawAmount;

    if (projectedTotal > 400) {
      errors.push("dailyWithdrawAmount");
    }

    if (account.type === "credit") {
      if (account.amount < 0) {
        let rem = account.creditLimit + account.amount;
        if (withdrawAmount > rem) {
          errors.push("creditWithdrawLimit");
        }
      }
    } else {
      if (withdrawAmount > account.amount) {
        errors.push("checkingWithdrawLimit");
      }
    }

    return errors;
  };

  const withdrawFunds = async () => {
    const errors = validateWithdraw();

    if (errors.length > 0) {
      setErrors(errors);
      return;
    }

    const requestOptions = {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: withdrawAmount }),
    };

    const response = await fetch(
      `http://localhost:3000/transactions/${account.accountNumber}/withdraw`,
      requestOptions
    );
    const data = await response.json();
    setAccount({
      accountNumber: data.account_number,
      name: data.name,
      amount: data.amount,
      type: data.type,
      creditLimit: data.credit_limit,
      withdrawn_today: data.withdrawn_today,
    });
  };

  return (
    <Paper className="account-dashboard">
      <div className="dashboard-header">
        <h1>Hello, {account.name}!</h1>
        <Button variant="contained" onClick={signOut}>
          Sign Out
        </Button>
      </div>
      <h2>Balance: ${account.amount}</h2>
      <Grid container spacing={2} padding={2}>
        <Grid item xs={6}>
          <Card className="deposit-card">
            <CardContent>
              <h3>Deposit</h3>
              <TextField
                name="depositAmount"
                label="Deposit Amount"
                variant="outlined"
                type="number"
                sx={{
                  display: "flex",
                  margin: "auto",
                }}
                onChange={(e) => handleOnChangeDeposit(e)}
                error={
                  errorState.creditDepositLimit ||
                  errorState.depositLimit ||
                  errorState.negativeDeposit
                }
                helperText={
                  errorState.creditDepositLimit
                    ? "You cannot deposit more than the amount required to bring your balance to zero."
                    : errorState.depositLimit
                    ? "You can deposit a maximum of $1,000 per transaction."
                    : errorState.negativeDeposit
                    ? "Deposit amount must be greater than zero."
                    : ""
                }
              />
              <Button
                variant="contained"
                sx={{
                  display: "flex",
                  margin: "auto",
                  marginTop: 2,
                }}
                onClick={depositFunds}
              >
                Submit
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6}>
          <Card className="withdraw-card">
            <CardContent>
              <h3>Withdraw</h3>
              <TextField
                name="withdrawAmount"
                label="Withdraw Amount"
                variant="outlined"
                type="number"
                sx={{
                  display: "flex",
                  margin: "auto",
                }}
                onChange={(e) => handleOnChangeWithdrawal(e)}
                error={
                  errorState.singleTransactionLimit ||
                  errorState.moduloFiveBills ||
                  errorState.checkingWithdrawLimit ||
                  errorState.negativeWithdrawal ||
                  errorState.creditWithdrawLimit ||
                  errorState.dailyWithdrawAmount
                }
                helperText={
                  errorState.singleTransactionLimit
                    ? "You can withdraw a maximum of $200 per transaction."
                    : errorState.moduloFiveBills
                    ? "Withdrawal amount must be in multiples of $5."
                    : errorState.negativeWithdrawal
                    ? "Withdrawal amount cannot be negative."
                    : errorState.checkingWithdrawLimit
                    ? "Insufficient funds to complete this withdrawal."
                    : errorState.creditWithdrawLimit
                    ? "Withdrawal exceeds your available credit limit."
                    : errorState.dailyWithdrawAmount
                    ? "You have exceeded your daily withdrawal limit."
                    : ""
                }
              />
              <Button
                variant="contained"
                sx={{
                  display: "flex",
                  margin: "auto",
                  marginTop: 2,
                }}
                onClick={withdrawFunds}
              >
                Submit
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Paper>
  );
};
