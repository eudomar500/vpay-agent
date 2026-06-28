// Renders a proposed plan for confirmation. Each step shows its title and the
// human-readable tx.description. Confirm runs the plan through the signer;
// Cancel discards it without signing.

import type { PlanStep } from "../../../core/types";

type PlanConfirmProps = {
  plan: PlanStep[];
  onConfirm: () => void;
  onCancel: () => void;
  busy: boolean;
};

export function PlanConfirm({ plan, onConfirm, onCancel, busy }: PlanConfirmProps) {
  return (
    <div className="panel" aria-label="Proposed plan">
      {plan.map((step, index) => (
        <div className="step" key={index}>
          <div className="title">{step.title}</div>
          <div className="description">{step.tx.description}</div>
        </div>
      ))}
      <div className="actions">
        <button type="button" onClick={onConfirm} disabled={busy}>
          Confirm
        </button>
        <button type="button" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
      </div>
    </div>
  );
}
