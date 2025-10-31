import axios from "axios";
import { useState, FormEvent, FC, useEffect } from "react";

export type FormValues = {
  originWsUrl: string;
  from: string;
  to: string;
  currency: string;
  address: string;
  amount: string;
};

type Props = {
  onSubmit: (values: FormValues) => void;
  loading: boolean;
};

const TransferForm: FC<Props> = ({ onSubmit, loading }) => {
  // Prepare states for the form fields
  const [chains, setChains] = useState<string[]>([]);
  const [originWsUrl, setOriginWsUrl] = useState("wss://rpc.astar.network");
  const [originChain, setOriginChain] = useState("Astar");
  const [destinationChain, setDestinationChain] = useState("Hydration");
  const [currency, setCurrency] = useState("DOT");
  const [address, setAddress] = useState(
    "5F5586mfsnM6durWRLptYt3jSUs55KEmahdodQ5tQMr9iY96"
  );
  const [amount, setAmount] = useState("10000000000000000000");

  const fetchChains = async () => {
    const response = await axios.get("https://api.lightspell.xyz/v3/chains");
    setChains(response.data);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchChains();
  }, []);

  // Handle form submission
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const transformedValues = {
      from: originChain,
      to: destinationChain,
      address,
      amount,
      currency,
      originWsUrl,
    };

    // Pass the submitted form values to the parent component
    onSubmit(transformedValues);
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Origin WS endpoint
        <input
          type="text"
          value={originWsUrl}
          onChange={(e) => setOriginWsUrl(e.target.value)}
          required
        />
      </label>

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
        Currency symbol
        <input
          type="text"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          required
        />
      </label>

      <label>
        Recipient address
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
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

      <button type="submit" disabled={loading}>
        {loading ? "Submitting..." : "Submit transaction"}
      </button>
    </form>
  );
};

export default TransferForm;
