export interface Model {
  id: string;
  name: string;
  display_name: string;
  description?: string | null;
  supports_thinking?: boolean;
  supports_reasoning_effort?: boolean;
  supports_vision?: boolean;
  provider?: string | null;
  recommended_mode?: "flash" | "thinking" | "pro" | "ultra" | null;
  strengths?: string[];
}
