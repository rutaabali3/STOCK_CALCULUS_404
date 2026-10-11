import type { IncomingMessage, ServerResponse } from 'http';

export type VercelRequest = IncomingMessage & {
  query: Partial<Record<string, string | string[]>>;
  cookies: Partial<Record<string, string>>;
  body: any;
};

export type VercelResponse = ServerResponse & {
  send: (body: any) => VercelResponse;
  json: (jsonBody: any) => VercelResponse;
  status: (statusCode: number) => VercelResponse;
  redirect: (statusOrUrl: string | number, url?: string) => VercelResponse;
};

export type ChargeMode = 'add' | 'deduct';

export type Commission =
  | { type: 'percent'; hundredthsPct: number }
  | { type: 'fixed'; paisa: number };

export type Labour =
  | { type: 'fixed'; paisa: number }
  | { type: 'perBag'; paisa: number };

export interface CalcInput {
  weightsG: number[];
  ratePaisa: number;
  tarePerBagG: number;
  commission?: Commission;
  labour?: Labour;
  chargeMode: ChargeMode;
  roundToRupee: boolean;
}

export interface CalcResult {
  bagCount: number;
  grossG: number;
  tareG: number;
  netG: number;
  mannUnitsTimes1000: number;
  amountPaisa: number;
  commissionPaisa: number;
  labourPaisa: number;
  chargesPaisa: number;
  totalPaisa: number;
  totalRupees: number;
}
