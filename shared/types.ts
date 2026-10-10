export type ChargeMode = 'add' | 'deduct';

export type Commission =
  | { type: 'percent'; hundredthsPct: number } // e.g. 2.5% -> 250
  | { type: 'fixed'; paisa: number };          // in paisa

export type Labour =
  | { type: 'fixed'; paisa: number }           // in paisa
  | { type: 'perBag'; paisa: number };         // in paisa per bag

export interface CalcInput {
  weightsG: number[];        // bag weights in grams (integers > 0)
  ratePaisa: number;         // rate per Mann in paisa (integer >= 0)
  tarePerBagG: number;       // tare per bag in grams (integer >= 0)
  commission?: Commission;
  labour?: Labour;
  chargeMode: ChargeMode;    // 'add' or 'deduct'
  roundToRupee: boolean;     // whether to round total to rupee
}

export interface CalcResult {
  bagCount: number;
  grossG: number;            // grams
  tareG: number;             // grams
  netG: number;              // grams (must be > 0)
  mannUnitsTimes1000: number;// netG / 40 (i.e. Mann with 3 decimal places * 1000)
  amountPaisa: number;       // paisa
  commissionPaisa: number;   // paisa
  labourPaisa: number;       // paisa
  chargesPaisa: number;      // paisa
  totalPaisa: number;        // paisa
  totalRupees: number;       // final rupees (either rounded or exact depending on roundToRupee)
}

export interface SlipPayload {
  id: string;                // client-generated ULID
  createdAt: string;         // ISO 8601 string
  deviceId?: string;
  seller?: string;
  buyer?: string;
  note?: string;
  weightsG: number[];
  ratePaisa: number;
  tarePerBagG: number;
  commission?: Commission;
  labour?: Labour;
  chargeMode: ChargeMode;
  roundToRupee: boolean;
}
