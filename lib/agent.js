const { spawn } = require("child_process");

function runAgent(command, args, prompt, timeoutMs) {
  return new Promise((resolve) => {
    const fullArgs = [...args, prompt];

    const child = spawn(command, fullArgs, {
      stdio: ["ignore", "pipe", "pipe"],
      cwd: process.cwd(),
    });

    let stdout = "";
    let stderr = "";

    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      resolve({ ok: false, stdout: stdout.trim(), stderr: `Timeout after ${timeoutMs}ms\n${stderr}`.trim() });
    }, timeoutMs);

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({ ok: false, stdout: stdout.trim(), stderr: `Spawn error: ${err.message}\n${stderr}`.trim() });
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({
        ok: code === 0,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: code,
      });
    });
  });
}

module.exports = { runAgent };
