import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";

/* ------------------------------------------------------------------ */
/*  Endpoint + client                                                 */
/* ------------------------------------------------------------------ */
const ENDPOINT = "https://models.github.ai/inference";
const apiKey = process.env.GITHUB_TOKEN!;
const client = ModelClient(ENDPOINT, new AzureKeyCredential(apiKey));

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */
interface OutputFormat {
    [key: string]: string | string[] | OutputFormat;
}
interface QA {
    question: string;
    answer: string;
}

/* ------------------------------------------------------------------ */
/*  Helper – quote keys if model forgets double quotes                */
/* ------------------------------------------------------------------ */
function quoteBareKeys(src: string): string {
    return src.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
}

/* ------------------------------------------------------------------ */
/*  Main                                                              */
/* ------------------------------------------------------------------ */
export async function strict_output(
    system_prompt: string,
    user_prompt: string | string[],
    output_format: OutputFormat,
    default_category = "",
    output_value_only = false,
    model = "openai/gpt-4.1",      // change to gpt-3.5 for more free calls
    temperature = 0.7,             // slightly lower => more deterministic JSON
    num_tries = 3,
    verbose = false
): Promise<QA[]> {

    const list_input = Array.isArray(user_prompt);
    const dynamic_elements = /<.*?>/.test(JSON.stringify(output_format));
    const list_output = /\[.*?\]/.test(JSON.stringify(output_format));
    let error_msg = "";

    for (let attempt = 0; attempt < num_tries; attempt++) {

        /* --------------- build enforcement prompt -------------------- */
        let fmtPrompt =
            `\nYou MUST return *valid JSON* only — nothing else.\n` +
            `Every key AND every string value must be wrapped in double quotes.\n` +
            `JSON schema to follow exactly: ${JSON.stringify(output_format)}.\n` +
            `Do NOT wrap the JSON in code fences (no \`\`\`).`;

        if (list_output)
            fmtPrompt += ` If a field is a list, choose the most relevant element.\n`;
        if (dynamic_elements)
            fmtPrompt += ` Replace anything inside <angle brackets> appropriately.\n`;
        if (list_input)
            fmtPrompt += ` Return a JSON ARRAY, one object per input item.\n`;

        /* --------------- call the GitHub model ----------------------- */
        const res = await client.path("/chat/completions").post({
            body: {
                model,
                temperature,
                top_p: 1,
                max_tokens: 800,
                frequency_penalty: 0,
                presence_penalty: 0,
                messages: [
                    { role: "system", content: system_prompt + fmtPrompt + error_msg },
                    { role: "user", content: list_input ? user_prompt.join("\n") : user_prompt }
                ]
            }
        });

        if (isUnexpected(res)) throw res.body.error;

        let raw = res.body.choices[0].message.content ?? "";
        raw = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
        raw = quoteBareKeys(raw);   // <- key-quoting fallback

        if (verbose) {
            console.log("---- RAW MODEL OUTPUT ----\n", raw, "\n--------------------------");
        }

        /* --------------- try to parse ------------------------------- */
        try {
            let parsed: any = JSON.parse(raw);

            /* ensure array shape if list_input = true */
            if (!Array.isArray(parsed)) parsed = [parsed];
            if (list_input && !Array.isArray(parsed))
                throw new Error("Expected JSON array for list input");

            /* minimal schema validation (keys exist, default category, etc.) */
            for (const item of parsed) {
                for (const key in output_format) {
                    if (/<.*?>/.test(key)) continue;         // skip dynamic keys
                    if (!(key in item)) throw new Error(`${key} missing`);

                    /* choice list post-processing (rare for open-ended) */
                    if (Array.isArray(output_format[key])) {
                        const choices = output_format[key] as string[];
                        if (Array.isArray(item[key])) item[key] = item[key][0];
                        if (!choices.includes(item[key]) && default_category)
                            item[key] = default_category;
                        if (typeof item[key] === "string" && item[key].includes(":"))
                            item[key] = item[key].split(":")[0];
                    }
                }
                /* value-only flatten */
                if (output_value_only) {
                    const vals = Object.values(item);
                    Object.assign(item, vals.length === 1 ? vals[0] : vals);
                }
            }

            /* success */
            return list_input ? parsed : parsed[0];

        } catch (err) {
            error_msg =
                `\n\n⚠️ Parse failed on attempt ${attempt + 1}. ` +
                `Please output *valid JSON* only.\n\nError: ${err}`;
            if (verbose) {
                console.error("JSON parse error:", err);
                console.error("Raw string that failed:", raw);
            }
        }
    }

    /* all attempts failed */
    return [];
}
