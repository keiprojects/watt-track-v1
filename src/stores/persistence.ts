type SetState<TState extends object> = (state: TState) => void;

export async function persistOptimisticState<TState extends object>({
  set,
  previousState,
  nextState,
  persist,
}: {
  set: SetState<TState>;
  previousState: TState;
  nextState: TState;
  persist: () => Promise<void>;
}): Promise<void> {
  set(nextState);

  try {
    await persist();
  } catch (error) {
    set(previousState);
    throw error;
  }
}
