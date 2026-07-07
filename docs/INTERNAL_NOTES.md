# Internal Developer Notes

- Contract reads via useReadContract work fine on Celo, but multicall batching is not supported on all RPCs.
- The useMiniPay hook detects isMiniPay synchronously, but some devices inject the provider async. Added 500ms fallback.
- Investigated rendering jitter on mobile layout when switching between MiniPay and desktop contexts.
- Reviewed component tree performance after adding MiniPayBar, no measurable regression.
- The useMiniPay hook detects isMiniPay synchronously, but some devices inject the provider async. Added 500ms fallback.
- Checked backward compatibility with older Celo RPC responses. The L2 migration changed some receipt fields.
- Checked backward compatibility with older Celo RPC responses. The L2 migration changed some receipt fields.
- Noticed the useBalance hook refetches on every block. Consider adding staleTime to reduce RPC load.
- The escrow contract refund timeout (7 days) seems appropriate for freelance gig markets.
- Tested cUSD approve + deposit flow on Celo mainnet. Gas estimates stable at ~45k per tx.
- Reviewed gas price oracle behavior on Celo. Since the Gingerbread upgrade, EIP-1559 is the default.
- Reviewed component tree performance after adding MiniPayBar, no measurable regression.
- The escrow contract refund timeout (7 days) seems appropriate for freelance gig markets.
