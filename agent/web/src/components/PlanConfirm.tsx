// Renders a proposed plan for confirmation. A plan may mix transfer steps and
// swap steps; each is shown with a title and a human-readable description.
// Confirm runs the whole plan; Cancel discards it without signing.

import type { PlanItem } from "../../../core/types";

type PlanConfirmProps = {
  plan: PlanItem[];
  onConfirm: () => void;
  onCancel: () => void;
  busy: boolean;
};

export function PlanConfirm({ plan, onConfirm, onCancel, busy }: PlanConfirmProps) {
  return (
    <div className="panel" aria-label="Proposed plan">
      {plan.map((step, index) => {
        const lines = stepLines(step);
        return (
          <div className="step" key={index}>
            <div className="title">{lines.title}</div>
            <div className="description">{lines.description}</div>
          </div>
        );
      })}
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

// A swap step carries its own description; a transfer step describes its tx.
function stepLines(step: PlanItem): { title: string; description: string } {
  if ("kind" in step && step.kind === "swap") {
    return {
      title: `Swap ${step.amount} ${step.fromToken} for ${step.toToken}`,
      description: step.description,
    };
  }
  return { title: step.title, description: step.tx.description };
}
