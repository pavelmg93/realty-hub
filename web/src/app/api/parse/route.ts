import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";

function runPython(script: string, input: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn("python3", ["-c", script], {
      env: { ...process.env, PYTHONIOENCODING: "utf-8" },
      timeout: 10000,
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });
    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(new Error(`Python exited with code ${code}: ${stderr}`));
      }
    });

    proc.on("error", reject);

    proc.stdin.write(input);
    proc.stdin.end();
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Request body must include 'text' as a string" },
        { status: 400 },
      );
    }

    const projectRoot = path.resolve(process.cwd(), "..");
    const script = `
import sys, json, dataclasses
sys.path.insert(0, '${projectRoot}/src')
from parsing.vietnamese_parser import parse_listing
result = parse_listing(sys.stdin.read())
d = dataclasses.asdict(result)
if d.get('parse_errors'):
    d['parse_errors'] = '; '.join(d['parse_errors'])
else:
    d['parse_errors'] = None
print(json.dumps(d, ensure_ascii=False))
`;

    try {
      const stdout = await runPython(script, text);
      const parsed = JSON.parse(stdout);
      return NextResponse.json({ parsed });
    } catch (pyError) {
      console.error("Python parser error:", pyError);
      return NextResponse.json({
        parsed: { description: text },
        warning: "Parser unavailable, text saved as description only",
      });
    }
  } catch (error) {
    console.error("Parse error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
