import { useState, FC } from "react";
import TransferForm from "./XcmTransferForm";
import {
  web3Accounts,
  web3Enable,
  web3FromAddress,
} from "@polkadot/extension-dapp";
import type { FormValues } from "./XcmTransferForm";
import type {
  Injected,
  InjectedAccountWithMeta,
} from "@polkadot/extension-inject/types";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { fetchFromApi } from "./fetchFromApi";

const XcmTransfer: FC = () => {
  const [errorVisible, setErrorVisible] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<InjectedAccountWithMeta[]>([]);
  const [selectedAccount, setSelectedAccount] =
    useState<InjectedAccountWithMeta>();

  const initAccounts = async () => {
    // Enable the wallet extension
    const allInjected = await web3Enable("ParaSpellXcmSdk");

    if (!allInjected) {
      alert("No wallet extension found, install it to connect");
      throw Error("No Wallet Extension Found!");
    }

    // Get all accounts
    const allAccounts = await web3Accounts();

    if (allAccounts.length === 0) {
      alert("No accounts found, create or import an account to connect");
      throw Error("No Accounts Found!");
    }

    // Save accounts to state
    setAccounts(allAccounts);

    // Set the first account as selected
    setSelectedAccount(allAccounts[0]);
  };

  const submitUsingApi = async (
    formValues: FormValues,
    injectorAddress: string,
    signer: Injected["signer"]
  ) => {
    if (!selectedAccount) {
      alert("No account selected, connect wallet first");
      return;
    }
    // Fetch the transaction hash from the API
    const txHash = await fetchFromApi({
      ...formValues,
      from:
        formValues.from === "Polkadot" || formValues.from === "Kusama"
          ? undefined
          : formValues.from,
      to:
        formValues.to === "Polkadot" || formValues.to === "Kusama"
          ? undefined
          : formValues.to,
      currency: {
        symbol: formValues.currency,
      },
    });

    if (!txHash) {
      throw new Error("Transaction hash not found");
    }

    // Create the API instance
    const wsProvider = new WsProvider(formValues.originWsUrl);
    const api = await ApiPromise.create({ provider: wsProvider });
    // Create the transfer transaction
    const tx = api.tx(txHash);
    // Sign and submit the transaction
    await tx.signAndSend(injectorAddress, { signer });
  };

  const onSubmit = async (formValues: FormValues) => {
    if (!selectedAccount) {
      alert("No account selected, connect wallet first");
      return;
    }

    setLoading(true);

    // Get the injector for the selected account
    const injector = await web3FromAddress(selectedAccount.address);

    try {
      // Create the transaction using the SDK and submit it
      await submitUsingApi(
        formValues,
        selectedAccount.address,
        injector.signer
      );
      alert("Transaction was successful!");
    } catch (e) {
      // Handle errors
      setError(e as Error);
      setErrorVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="formHeader">
        {accounts.length > 0 ? (
          <div>
            <div>
              <h4>Connected to:</h4>
            </div>
            <select
              style={{}}
              value={selectedAccount?.address}
              onChange={(e) =>
                setSelectedAccount(
                  accounts.find((acc) => acc.address === e.target.value)
                )
              }
            >
              {accounts.map((acc) => (
                <option key={acc.address} value={acc.address}>
                  {acc.meta.name} - {acc.address}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <button onClick={initAccounts}>Connect Wallet</button>
        )}
      </div>
      <TransferForm onSubmit={onSubmit} loading={loading} />
      <div>{errorVisible && <p>{error?.message}</p>}</div>
    </div>
  );
};

export default XcmTransfer;
