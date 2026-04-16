import { useState, FC } from "react";
import TransferForm from "./XcmTransferForm";
import type { FormValues, ApiTransaction } from "./types";
import { fetchFromApi } from "./fetchFromApi";
import { submitTransaction } from "./utils";
import {
  connectInjectedExtension,
  getInjectedExtensions,
  InjectedExtension,
  InjectedPolkadotAccount,
  PolkadotSigner,
} from "polkadot-api/pjs-signer";
import { Binary } from "polkadot-api";
import { createWsClient } from "polkadot-api/ws";
import axios from "axios";
import { API_URL } from "./consts";

const XcmTransfer: FC = () => {
  const [errorVisible, setErrorVisible] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);
  const [extensions, setExtensions] = useState<string[]>([]);
  const [selectedExtension, setSelectedExtension] =
    useState<InjectedExtension | null>();
  const [accounts, setAccounts] = useState<InjectedPolkadotAccount[]>([]);
  const [selectedAccount, setSelectedAccount] =
    useState<InjectedPolkadotAccount>();

  const initAccounts = async () => {
    // Get extensions
    const extensions = getInjectedExtensions();

    if (extensions.length === 0) {
      alert("No wallet extension found, install it to connect");
      throw Error("No Wallet Extension Found!");
    }

    // Save extensions to state
    setExtensions(extensions);
  };

  const submitUsingApi = async (
    formValues: FormValues,
    signer: PolkadotSigner,
  ) => {
    if (!selectedAccount) {
      alert("No account selected, connect wallet first");
      return;
    }

    // Build API params
    const apiParams = {
      from: formValues.from,
      to: formValues.to,
      recipient: formValues.recipient,
      sender: selectedAccount.address,
      currency: {
        location: formValues.currency!.location,
        amount: formValues.amount,
      },
      ...(formValues.swapEnabled && formValues.currencyTo
        ? {
            swapOptions: {
              currencyTo: { symbol: formValues.currencyTo },
              ...(formValues.exchange
                ? { exchange: [formValues.exchange] }
                : {}),
            },
          }
        : {}),
    };

    // Fetch the transactions from the API
    const transactions = await fetchFromApi(apiParams);

    // Each transaction may have a different origin chain
    for (const apiTx of transactions) {
      await submitApiTransaction(apiTx, signer);
    }
  };

  // Submit a single API transaction by resolving WS endpoint for its chain
  const submitApiTransaction = async (
    apiTx: ApiTransaction,
    signer: PolkadotSigner,
  ) => {
    // Fetch WS endpoints for the transaction's origin chain
    const response = await axios.get(
      `${API_URL}/chains/${apiTx.chain}/ws-endpoints`,
    );
    const endpoints = response.data as string[];
    if (endpoints.length === 0) {
      throw new Error(`No WS endpoints found for chain ${apiTx.chain}`);
    }

    const client = createWsClient(endpoints[0]);
    const callData = Binary.fromHex(apiTx.tx);
    const tx = await client.getUnsafeApi().txFromCallData(callData);
    await submitTransaction(tx, signer);
  };

  const onSubmit = async (formValues: FormValues) => {
    if (!selectedAccount) {
      alert("No account selected, connect wallet first");
      return;
    }

    setLoading(true);

    // Get the injector for the selected account
    const signer = selectedAccount.polkadotSigner;

    try {
      // Create the transaction using the SDK and submit it
      await submitUsingApi(formValues, signer);
      alert("Transaction was successful!");
    } catch (e) {
      // Handle errors
      setError(e as Error);
      setErrorVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const onExtensionSelect = async (name: string) => {
    const injectedExtension = await connectInjectedExtension(name);
    setSelectedExtension(injectedExtension);

    const accounts = injectedExtension.getAccounts();
    setAccounts(accounts);

    // Preselect the first account if available
    if (accounts.length > 0) setSelectedAccount(accounts[0]);
  };

  return (
    <div>
      <div className="formHeader">
        {extensions.length > 0 ? (
          <div>
            <h4>Select extension:</h4>
            <select
              defaultValue=""
              value={selectedExtension?.name}
              onChange={(e) => onExtensionSelect(e.target.value)}
            >
              <option disabled value="">
                -- select an option --
              </option>
              {extensions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <button onClick={initAccounts}>Connect Wallet</button>
        )}
        {accounts.length > 0 && (
          <div>
            <div>
              <h4>Select account:</h4>
            </div>
            <select
              style={{}}
              value={selectedAccount?.address}
              onChange={(e) =>
                setSelectedAccount(
                  accounts.find((acc) => acc.address === e.target.value),
                )
              }
            >
              {accounts.map(({ name, address }) => (
                <option key={address} value={address}>
                  {name} - {address}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      <TransferForm onSubmit={onSubmit} loading={loading} />
      <div>{errorVisible && <p>{error?.message}</p>}</div>
    </div>
  );
};

export default XcmTransfer;
