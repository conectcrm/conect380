declare module '@stripe/stripe-js' {
  export interface Stripe {
    confirmPayment: (...args: any[]) => Promise<any>;
    elements?: (...args: any[]) => any;
  }

  export interface StripeError {
    message: string;
    type?: string;
  }

  export type StripeElements = any;
  export type StripeCardElement = any;

  export function loadStripe(key: string): Promise<Stripe | null>;
}
