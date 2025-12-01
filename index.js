const { spawn } = require("child_process");

// Start the backend using the package.json script in the backend folder.
// This preserves the backend's start script behaviour and lets Render run `node index.js`.
const cmd = process.platform === "win32" ? "npm.cmd" : "npm";
const args = ["run", "start", "--prefix", "backend"];

console.log(`Starting backend: ${cmd} ${args.join(" ")}`);

const child = spawn(cmd, args, { stdio: "inherit", shell: false });

child.on("exit", (code, signal) => {
  if (signal) {
    console.log(`Backend process terminated with signal ${signal}`);
    process.exit(1);
  } else {
    console.log(`Backend process exited with code ${code}`);
    process.exit(code);
  }
});

child.on("error", (err) => {
  console.error("Failed to start backend process:", err);
  process.exit(1);
});
