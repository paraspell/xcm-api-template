export type AssetInfo = {
  symbol?: string;
  assetId?: string;
  location: object;
};

export type FormValues = {
  originWsUrl: string;
  from: string;
  to: string;
  currency: AssetInfo;
  recipient: string;
  amount: string;
  swapEnabled: boolean;
  currencyTo?: string;
  exchange?: string;
};

export type ApiParams = {
  from?: string;
  to?: string;
  currency: {
    location: object;
    amount: string;
  };
  recipient: string;
  sender: string;
  swapOptions?: {
    currencyTo: { symbol: string };
    exchange?: string[];
  };
};

export type ApiTransaction = {
  type: string;
  chain: string;
  tx: string;
};
