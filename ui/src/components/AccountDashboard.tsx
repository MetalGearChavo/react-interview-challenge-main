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
  });

  const { signOut } = props;

  type ErrorKey =
    | "singleTransactionLimit"
    | "moduloFiveBills"
    | "negativeWithdrawal"
    | "checkingWithdrawLimit"
    | "creditWithdrawLimit"
    | "dailyWithdrawAmount";
  const setErrors = (errors: Array<ErrorKey>) => {
    const newErrors: Record<ErrorKey, boolean> = {
      singleTransactionLimit: false,
      moduloFiveBills: false,
      negativeWithdrawal: false,
      checkingWithdrawLimit: false,
      creditWithdrawLimit: false,
      dailyWithdrawAmount: false,
    };
    errors.forEach((error) => {
      newErrors[error] = true;
    });
    setErrorState(newErrors);
  };

  const handleOnChange = (
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
      }));
    }
    setWithdrawAmount(+e.target.value);
  };

  const depositFunds = async () => {
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

  const withdrawFunds = async () => {
    const errors: ErrorKey[] = [];

    const requestOptions = {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: withdrawAmount }),
    };

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

    if (account.type === "checking") {
      if (withdrawAmount > account.amount) {
        errors.push("checkingWithdrawLimit");
      }
    }

    if (account.type === "credit") {
      if (account.amount < 0) {
        let rem = account.creditLimit + account.amount;
        if (withdrawAmount > rem) {
          errors.push("creditWithdrawLimit");
        }
      }
    }

    if (errors.length > 0) {
      setErrors(errors);
      return;
    }

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
                label="Deposit Amount"
                variant="outlined"
                type="number"
                sx={{
                  display: "flex",
                  margin: "auto",
                }}
                onChange={(e) => setDepositAmount(+e.target.value)}
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
                onChange={(e) => handleOnChange(e)}
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
