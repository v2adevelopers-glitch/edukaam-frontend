// Cross-page UI state that is not auth. Page-local state stays in useState, so this is
// intentionally small.
export const initialCommonState = {};

export const commonReducer = (state, action) => {
  switch (action.type) {
    case "RESET_COMMON":
      return initialCommonState;
    default:
      return state;
  }
};
