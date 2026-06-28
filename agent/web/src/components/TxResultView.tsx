// Shows the result of each executed transaction: success state, the hash with a
// link to the Arc explorer, and the error when one was returned.

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
      {results.map((result, index) => (
        <div className={`result ${result.success ? "ok" : "failed"}`} key={index}>
          <div>{result.success ? "Confirmed" : "Failed"}</div>
          {result.hash !== ZERO_HASH ? (
            <div>
              <a href={`${EXPLORER_TX}/${result.hash}`} target="_blank" rel="noreferrer">
                {result.hash}
              </a>
            </div>
          ) : null}
          {result.error ? <div className="error">{result.error}</div> : null}
        </div>
      ))}
    </div>
  );
}
