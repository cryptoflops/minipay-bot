"use client";

import { ThirdwebProvider } from "thirdweb/react";
import { createThirdwebClient } from "thirdweb";

// Client-side thirdweb client (uses clientId, not secretKey)
export const thirdwebClient = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "minipaybot-dev",
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThirdwebProvider>
      {children}
    </ThirdwebProvider>
  );
}
