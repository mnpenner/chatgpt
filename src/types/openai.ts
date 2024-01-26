export interface ChatDelta {
    id:      string;
    object:  string;
    created: number;
    choices: Choice[];
    usage:   Usage;
}

export interface Choice {
    index:         number;
    delta:       Message;
    finish_reason: string;
}

// https://platform.openai.com/docs/guides/text-generation/chat-completions-api
export interface Message {
    role:    'system'|'user'|'assistant';
    content: string;
}

export interface Usage {
    prompt_tokens:     number;
    completion_tokens: number;
    total_tokens:      number;
}
