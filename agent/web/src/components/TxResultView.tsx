// Shows the result of each executed transaction. A confirmed result links to the
// Arc explorer; a failed result shows only its short readable error. The error
// string is already cleaned by the signer, so this renders plain text with no
// JSON, stack, or multi-line dump.

import type { TxResult } from "../../../core/types";

// Arc testnet explorer base. This is the test shell, so it is fixed here rather
// than threaded through config.
const EXPLORER_TX = "https://testnet.arcscan.app/tx";

const ZERO_HASH = `0x${"0".repeat(64)}`;

type TxResultViewProps = {
  results: TxResult[];
};

export function TxResultView({ results }: TxResultViewProps) {
  return (
    <div className="panel" aria-label="Transaction results">
      {results.map((result, index) => {
        const hasHash = result.hash !== ZERO_HASH;
        return (
          <div className={`result ${result.success ? "ok" : "failed"}`} key={index}>
            <div>{result.success ? "Confirmed" : "Failed"}</div>
            {hasHash ? (
              <div>
                <a href={`${EXPLORER_TX}/${result.hash}`} target="_blank" rel="noreferrer">
                  {result.hash}
                </a>
              </div>
            ) : null}
            {!result.success && result.error ? <div className="error">{result.error}</div> : null}
          </div>
        );
      })}
    </div>
  );
}
