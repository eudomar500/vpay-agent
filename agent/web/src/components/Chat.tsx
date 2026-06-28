// Message list and input. The input is disabled while a request is in flight or
// while a plan is awaiting confirmation, so the confirmation gate is respected.

import { useState } from "react";
import type { ChatMessage } from "../../../core/types";

type ChatProps = {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  disabled: boolean;
};

export function Chat({ messages, onSend, disabled }: ChatProps) {
  const [text, setText] = useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) {
      return;
    }
    onSend(trimmed);
    setText("");
  }

  return (
    <div>
      <div className="messages" aria-label="Conversation">
        {messages.map((message, index) => (
          <div className={`message ${message.role}`} key={index}>
            <div className="role">{message.role}</div>
            <div>{message.content}</div>
          </div>
        ))}
      </div>
      <form className="composer" onSubmit={handleSubmit}>
        <label htmlFor="composer-input" className="role">
          Message
        </label>
        <input
          id="composer-input"
          type="text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Ask the agent, for example: send 0.01 USDC to 0x..."
          disabled={disabled}
          autoComplete="off"
        />
        <button type="submit" disabled={disabled}>
          Send
        </button>
      </form>
    </div>
  );
}
