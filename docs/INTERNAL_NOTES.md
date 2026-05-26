# Internal Developer Notes

- Contract reads via useReadContract work fine on Celo, but multicall batching is not supported on all RPCs.
- The useMiniPay hook detects isMiniPay synchronously, but some devices inject the provider async. Added 500ms fallback.
