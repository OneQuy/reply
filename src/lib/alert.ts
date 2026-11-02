type ShowAlert = (message: string) => void;

let showImpl: ShowAlert | null = null;

export function registerAlert(show: ShowAlert | null) {
  showImpl = show;
}

export function showAlert(message: string) {
  showImpl?.(message);
}
