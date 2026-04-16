import axios from "axios";
import { useState, useMemo, FormEvent, FC, useEffect } from "react";
import { API_URL } from "./consts";
import type { AssetInfo, FormValues } from "./types";

type Props = {
  onSubmit: (values: FormValues) => void;
  loading: boolean;
};

const TransferForm: FC<Props> = ({ onSubmit, loading }) => {
  // Prepare states for the form fields
  const [chains, setChains] = useState<string[]>([]);
  const [originWsUrl, setOriginWsUrl] = useState("");
  const [originChain, setOriginChain] = useState("Astar");
  const [destinationChain, setDestinationChain] = useState("Hydration");
  const [supportedAssets, setSupportedAssets] = useState<AssetInfo[]>([]);
  const [currencyOptionId, setCurrencyOptionId] = useState("");
  const [currencyTo, setCurrencyTo] = useState("DOT");
  const [swapEnabled, setSwapEnabled] = useState(false);
  const [exchange, setExchange] = useState("");
  const [recipient, setRecipient] = useState(
    "5F5586mfsnM6durWRLptYt3jSUs55KEmahdodQ5tQMr9iY96",
  );
  const [amount, setAmount] = useState("5");

  const fetchChains = async () => {
    const response = await axios.get(`${API_URL}/chains`);
    setChains(response.data);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchChains();
  }, []);

  useEffect(() => {
    const fetchWsEndpoints = async () => {
      const response = await axios.get(
        `${API_URL}/chains/${originChain}/ws-endpoints`,
      );
      const endpoints = response.data as string[];
      if (endpoints.length > 0) {
        setOriginWsUrl(endpoints[0]);
      }
    };
    fetchWsEndpoints();
  }, [originChain]);

  useEffect(() => {
    const fetchAssets = async () => {
      const response = await axios.get(
        `${API_URL}/supported-assets?origin=${originChain}&destination=${destinationChain}`,
      );
      const assets = response.data as AssetInfo[];
      setSupportedAssets(assets);
    };
    fetchAssets();
  }, [originChain, destinationChain]);

  // Create a map of assets keyed by a unique id
  const currencyMap = useMemo(
    () =>
      supportedAssets.reduce(
        (map: Record<string, AssetInfo>, asset: AssetInfo) => {
          const key = `${asset.symbol ?? "NO_SYMBOL"}-${JSON.stringify(asset.location)}`;
          map[key] = asset;
          return map;
        },
        {},
      ),
    [supportedAssets],
  );

  const currencyOptions = useMemo(
    () =>
      Object.keys(currencyMap).map((key) => ({
        value: key,
        label: `${currencyMap[key].symbol ?? "Unknown"} - ${currencyMap[key].assetId ?? "Location"}`,
      })),
    [currencyMap],
  );

  useEffect(() => {
    if (currencyOptions.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrencyOptionId(currencyOptions[currencyOptions.length - 1].value);
    }
  }, [currencyOptions]);

  // Handle form submission
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const transformedValues = {
      from: originChain,
      to: destinationChain,
      recipient,
      amount,
      currency: currencyMap[currencyOptionId],
      originWsUrl,
      swapEnabled,
      currencyTo: swapEnabled ? currencyTo : undefined,
      exchange: swapEnabled && exchange ? exchange : undefined,
    };

    // Pass the submitted form values to the parent component
    onSubmit(transformedValues);
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Origin chain
        <select
          value={originChain}
          onChange={(e) => setOriginChain(e.target.value)}
          required
        >
          {chains.map((chain) => (
            <option key={chain} value={chain}>
              {chain}
            </option>
          ))}
        </select>
      </label>

      <label>
        Destination chain
        <select
          value={destinationChain}
          onChange={(e) => setDestinationChain(e.target.value)}
          required
        >
          {chains.map((chain) => (
            <option key={chain} value={chain}>
              {chain}
            </option>
          ))}
        </select>
      </label>

      <label>
        Currency
        <select
          value={currencyOptionId}
          onChange={(e) => setCurrencyOptionId(e.target.value)}
          required
        >
          {currencyOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        Recipient address
        <input
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          required
        />
      </label>

      <label>
        Amount
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </label>

      <button
        type="button"
        className="secondary"
        onClick={() => setSwapEnabled((prev) => !prev)}
      >
        {swapEnabled ? "- Remove Swap" : "+ Add Swap"}
      </button>

      {swapEnabled && (
        <>
          <label>
            Exchange
            <input
              type="text"
              value={exchange}
              onChange={(e) => setExchange(e.target.value)}
              placeholder="Leave empty for auto"
            />
          </label>

          <label>
            Currency To
            <input
              type="text"
              value={currencyTo}
              onChange={(e) => setCurrencyTo(e.target.value)}
              required
            />
          </label>
        </>
      )}

      <button type="submit" disabled={loading}>
        {loading ? "Submitting..." : "Submit transaction"}
      </button>
    </form>
  );
};

export default TransferForm;
