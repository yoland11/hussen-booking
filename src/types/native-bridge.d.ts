export {};

declare global {
  interface Window {
    NativeBridge?: {
      printCurrentPage?: () => void;
      shareText?: (title: string, text: string) => void;
    };
  }
}
