import { Clipboard, showHUD, getPreferenceValues, showToast, Toast, getSelectedText } from "@raycast/api";
import Anthropic from "@anthropic-ai/sdk";

interface Preferences {
  apiKey: string;
}

const SYSTEM_PROMPT = `You are a writing assistant. Improve the given text to be clearer, more concise, and more professional while preserving the original meaning and tone. Output only the improved text with no explanations, preamble, or quotes.`;

export default async function Command() {
  const preferences = getPreferenceValues<Preferences>();

  // Get selected text
  let selectedText: string;
  try {
    selectedText = await getSelectedText();
  } catch {
    await showHUD("❌ No text selected");
    return;
  }

  if (!selectedText?.trim()) {
    await showHUD("❌ No text selected");
    return;
  }

  const toast = await showToast({
    style: Toast.Style.Animated,
    title: "Improving text...",
  });

  try {
    const client = new Anthropic({
      apiKey: preferences.apiKey,
    });

    const message = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: selectedText,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    const improvedText = content.text;

    // Copy to clipboard
    await Clipboard.copy(improvedText);

    // Try to paste (this will work in apps that support it, like Slack)
    await Clipboard.paste(improvedText);

    toast.style = Toast.Style.Success;
    toast.title = "✓ Text improved and pasted";
  } catch (error) {
    toast.style = Toast.Style.Failure;
    toast.title = "Failed to improve text";
    toast.message = error instanceof Error ? error.message : "Unknown error";
  }
}
