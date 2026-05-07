type Step<T> =
  | { value: T; continue: true }
  | { value: T; continue: false }
  | { done: true };

type RunContext = {
  signal: AbortSignal;
  onCancel(fn: () => void | Promise<void>): void;
};

export function cancellableAsyncIterable<T>(
  step: (ctx: RunContext) => Promise<Step<T>>,
): AsyncIterable<T> {
  return {
    [Symbol.asyncIterator](): AsyncIterator<T> {
      const controller = new AbortController();
      const cancelHandlers: (() => void | Promise<void>)[] = [];

      let done = false;
      let pendingWork: Promise<IteratorResult<T, void>> | undefined;

      const ctx: RunContext = {
        signal: controller.signal,
        onCancel(fn) {
          cancelHandlers.push(fn);
        },
      };

      async function dispose() {
        for (const fn of cancelHandlers) {
          try {
            await fn();
          } catch {
            // ignore
          }
        }
      }

      async function next(): Promise<IteratorResult<T, void>> {
        if (done) {
          return { done: true, value: undefined };
        }

        try {
          const result = await step(ctx);

          // uncommon, but runner can itself orchestrate done
          if ("done" in result) {
            done = true;
            await dispose();
            return { done: true, value: undefined };
          }

          // if the runner is on its last step, it provides the final value
          // and says not to continue. we mark done: true here and go to the next step
          // to finalize the iterator
          if (!result.continue) {
            done = true;
            await dispose();
            return { done: false, value: result.value };
          } else {
            return { done: false, value: result.value };
          }
        } catch (err) {
          done = true;
          await dispose();

          if (controller.signal.aborted) {
            return { done: true, value: undefined };
          }

          throw err;
        }
      }

      return {
        next() {
          //
          pendingWork =
            pendingWork ??
            next().finally(() => {
              pendingWork = undefined;
            });

          return pendingWork;
        },
        async return() {
          done = true;
          controller.abort();
          await dispose();

          return { done: true, value: undefined };
        },
      };
    },
  };
}

export function once<T>(value: T): AsyncIterable<T> {
  return {
    async *[Symbol.asyncIterator]() {
      yield value;
    },
  };
}

export function cancellableDelay(
  ms: number,
  signal: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException(`Aborted: ${signal.reason}`));
      return;
    }

    const timer = setTimeout(() => {
      resolve();
    }, ms);

    signal.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new DOMException(`Aborted: ${signal.reason}`));
    });
  });
}
