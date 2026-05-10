const { spawn } = require("child_process");

function runAgent(command, args, prompt, timeoutMs) {
  return new Promise((resolve, reject) => {
    const fullArgs = [...args, prompt];

    const child = spawn(command, fullArgs, {
      stdio: ["ignore", "pipe", "pipe"],
      cwd: process.cwd(),
    });

    let stdout = "";
    let stderr = "";

    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`Agent timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
      } else {
        reject(
          new Error(`Exit code ${code}${stderr ? "\nStderr:\n" + stderr : ""}`)
        );
      }
    });
  });
}

module.exports = { runAgent };
