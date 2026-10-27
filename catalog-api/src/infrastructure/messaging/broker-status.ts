export type BrokerState = 'up' | 'down' | 'disabled';

export abstract class IBrokerStatus {
  abstract check(): Promise<BrokerState>;
}
