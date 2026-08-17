import { ApolloLink, Observable } from "@apollo/client";
import { print } from "graphql";
import { createClient } from "graphql-ws";
import type { Client, ClientOptions, Sink } from "graphql-ws";
import type { Subscriber } from "rxjs";

type ClientFactory = (options: ClientOptions) => Client;

type ActiveSubscription = {
  operation: ApolloLink.Operation;
  observer: Subscriber<ApolloLink.Result>;
  generation: number;
  dispose: (() => void) | null;
};

export function cappedReconnectDelay(attempt: number) {
  return Math.min(1_000 * 2 ** Math.max(0, attempt), 30_000);
}

export class RestartableSubscriptionLink extends ApolloLink {
  private readonly options: {
    url: string;
    getAccessToken: () => string | null;
    subscribeAccessToken?: (listener: () => void) => () => void;
    createClient?: ClientFactory;
  };
  private client: Client;
  private readonly active = new Set<ActiveSubscription>();
  private generation = 0;
  private readonly unsubscribeToken?: () => void;

  constructor(
    options: {
      url: string;
      getAccessToken: () => string | null;
      subscribeAccessToken?: (listener: () => void) => () => void;
      createClient?: ClientFactory;
    },
  ) {
    super();
    this.options = options;
    this.client = this.makeClient();
    this.unsubscribeToken = options.subscribeAccessToken?.(() => this.restart());
  }

  private makeClient() {
    const factory = this.options.createClient ?? createClient;
    return factory({
      url: this.options.url,
      lazy: true,
      retryAttempts: Infinity,
      retryWait: async (retries) => {
        await new Promise((resolve) => setTimeout(resolve, cappedReconnectDelay(retries)));
      },
      connectionParams: () => {
        const accessToken = this.options.getAccessToken();
        return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      },
    });
  }

  private start(record: ActiveSubscription) {
    const generation = this.generation;
    record.generation = generation;
    const sink: Sink<ApolloLink.Result> = {
      next: (value) => {
        if (record.generation === generation) record.observer.next(value);
      },
      error: (error) => {
        if (record.generation === generation) record.observer.error(error);
      },
      complete: () => {
        if (record.generation === generation) record.observer.complete();
      },
    };
    record.dispose = this.client.subscribe(
      {
        query: print(record.operation.query),
        variables: record.operation.variables,
        operationName: record.operation.operationName,
        extensions: record.operation.extensions,
      },
      sink,
    );
  }

  restart() {
    this.generation += 1;
    for (const record of this.active) record.dispose?.();
    void this.client.dispose();
    this.client = this.makeClient();
    for (const record of this.active) this.start(record);
  }

  override request(operation: ApolloLink.Operation) {
    return new Observable<ApolloLink.Result>((observer) => {
      const record: ActiveSubscription = {
        operation,
        observer,
        generation: this.generation,
        dispose: null,
      };
      this.active.add(record);
      this.start(record);
      return () => {
        this.active.delete(record);
        record.dispose?.();
      };
    });
  }

  dispose() {
    this.unsubscribeToken?.();
    for (const record of this.active) record.dispose?.();
    this.active.clear();
    void this.client.dispose();
  }
}
