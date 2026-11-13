export type AsyncProject<TSource, TTarget> = (
  value: TSource,
) => Promise<TTarget | null> | TTarget | null;

export function filterMapAsyncIterator<TSource, TTarget>(
  source: AsyncIterableIterator<TSource>,
  project: AsyncProject<TSource, TTarget>,
): AsyncIterableIterator<TTarget> {
  let closed = false;

  const closeSource = async (): Promise<void> => {
    if (closed) {
      return;
    }
    closed = true;
    if (source.return) {
      await source.return();
    }
  };

  return {
    [Symbol.asyncIterator](): AsyncIterableIterator<TTarget> {
      return this;
    },

    async next(): Promise<IteratorResult<TTarget>> {
      try {
        while (true) {
          const result = await source.next();
          if (result.done) {
            closed = true;
            return { done: true, value: undefined };
          }

          const mapped = await project(result.value);
          if (mapped !== null) {
            return { done: false, value: mapped };
          }
        }
      } catch (error) {
        await closeSource();
        throw error;
      }
    },

    async return(): Promise<IteratorResult<TTarget>> {
      await closeSource();
      return { done: true, value: undefined };
    },

    async throw(error?: unknown): Promise<IteratorResult<TTarget>> {
      await closeSource();
      throw error;
    },
  };
}
