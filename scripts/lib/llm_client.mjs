export function makeLlmCall(config, { fetchImpl = fetch, apiKey = process.env.LLM_API_KEY } = {}) {
  return async function call(prompt) {
    const res = await fetchImpl(`${config.base_url}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: config.model,
        temperature: config.temperature ?? 0.7,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`LLM ${res.status}: ${t}`);
    }
    const data = await res.json();
    return data.choices[0].message.content;
  };
}
