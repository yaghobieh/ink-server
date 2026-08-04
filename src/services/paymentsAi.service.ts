export type PaymentsAdviseRequest = {
  country?: string;
  currency?: string;
  amountIls?: number;
  businessType?: string;
};

export type PaymentsAdviseResponse = {
  recommended: string[];
  avoid: string[];
  notes: string[];
  nextSteps: string[];
};

export const advisePaymentsForSeller = (input: PaymentsAdviseRequest): PaymentsAdviseResponse => {
  const country = (input.country ?? 'IL').toUpperCase();
  if (country === 'IL') {
    return {
      recommended: ['PayPal Commerce', 'Bit / local Israeli rails', 'manual invoice fallback'],
      avoid: ['Polar (no IL seller)', 'Apple Pay direct without local PSP'],
      notes: [
        'Israel sellers need a PayPal-first checkout until entitlement BE is live.',
        'Keep license keys issued only after webhook confirmation.',
      ],
      nextSteps: [
        'Collect seller country + VAT id',
        'Issue entitlement via /api/entitlements after paid webhook',
        'Unlock portal premium with licenseKey',
      ],
    };
  }
  return {
    recommended: ['Polar', 'Stripe Checkout', 'PayPal'],
    avoid: [],
    notes: ['Default international stack.'],
    nextSteps: ['Wire webhook → entitlement → licenseKey'],
  };
};
