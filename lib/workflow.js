const path = require("path");
const { runAgent } = require("./agent");
const { loadPrompt, renderPrompt } = require("./prompt");
const { createRunDir, readMeta, writeMeta, updateAgentMeta, fileExists, readRunFile } = require("./run");

async function runPlanStage(config, promptsDir, runDir, topic, skipAgents = []) {
  const { agents, defaults } = config;
  const planStage = config.workflow.stages.find(s => s.id === "plan");
  if (!planStage) throw new Error("No 'plan' stage defined in workflow");

  const planAgents = (planStage.agents || Object.keys(agents)).filter(a => !skipAgents.includes(a));
  const archPromptName = planStage.prompt || "architect.md";
  const archTemplate = loadPrompt(promptsDir, archPromptName);

  console.log(`\nPlanning with ${planAgents.length} agents in parallel...\n`);

  const tasks = planAgents.map(async (agentName, idx) => {
    const agent = agents[agentName];
    if (!agent || !agent.command) {
      console.log(`  [${agentName}] Skipped (no command configured - handled by orchestrator)`);
      return { agent: agentName, status: "skipped" };
    }

    const prompt = renderPrompt(archTemplate, {
      role: agent.role,
      description: agent.description,
      input: topic,
      outputLanguage: defaults.outputLanguage,
    });

    const num = String(idx + 1).padStart(2, "0");
    const archFile = `${num}_${agentName}_architect.md`;
    const outputFile = path.join(runDir, archFile);

    console.log(`  [${agentName}] Starting...`);
    try {
      const result = await runAgent(agent.command, agent.args || [], prompt, (defaults.timeoutSeconds || 1800) * 1000);
      require("fs").writeFileSync(outputFile, result.stdout);
      updateAgentMeta(runDir, agentName, "done", archFile);
      console.log(`  [${agentName}] Done (${result.stdout.length} chars)`);
      return { agent: agentName, status: "ok" };
    } catch (err) {
      require("fs").writeFileSync(outputFile, `Error: ${err.message}`);
      updateAgentMeta(runDir, agentName, "failed", archFile);
      console.log(`  [${agentName}] FAILED: ${err.message}`);
      return { agent: agentName, status: "failed", error: err.message };
    }
  });

  const results = await Promise.allSettled(tasks);
  let ok = 0, fail = 0;
  for (const r of results) {
    if (r.value?.status === "ok") ok++;
    else if (r.value?.status !== "skipped") fail++;
  }
  console.log(`\n${ok} succeeded, ${fail} failed`);
}

async function runReviewStage(config, promptsDir, runDir, stage, skipAgents = []) {
  const reviewTemplate = loadPrompt(promptsDir, stage.prompt || "reviewer.md");
  const reviewAgents = (stage.agents || ["claude", "codex"]).filter(a => !skipAgents.includes(a));
  const rounds = stage.rounds || 1;

  // Detect which rounds already have outputs — skip completed rounds
  let startRound = 1;
  for (let r = rounds; r >= 1; r--) {
    const prefix = r === 1 ? "10" : "12";
    const hasAny = reviewAgents.some(a => fileExists(runDir, `${prefix}_review_${a}_round${r === 1 ? "1" : r}.md`));
    if (hasAny) { startRound = r + 1; break; }
  }
  if (startRound > rounds) {
    console.log(`All ${rounds} review rounds already complete.`);
    return;
  }

  for (let round = startRound; round <= rounds; round++) {
    const planFile = round === 1 ? "07_final_plan.md" : "11_deepseek_synthesis_v2.md";
    if (!fileExists(runDir, planFile)) {
      console.log(`Plan file ${planFile} not found — skipping review round ${round}`);
      return;
    }

    const planContent = readRunFile(runDir, planFile);
    const truncated = planContent.length > 15000;
    const reviewInput = planContent.slice(0, 15000);
    if (truncated) console.log(`  (input truncated from ${planContent.length} to 15000 chars)`);
    console.log(`\nReview Round ${round}/${rounds}...\n`);

    const prefix = round === 1 ? "10" : "12";
    const suffix = round === 1 ? "round1" : `round${round}`;

    const tasks = reviewAgents.map(async (name) => {
      const agent = config.agents[name];
      if (!agent || !agent.command) return { agent: name, status: "skipped" };

      const prompt = renderPrompt(reviewTemplate, {
        role: agent.role,
        description: agent.description,
        plan: reviewInput,
        outputLanguage: config.defaults.outputLanguage,
      });

      const outputFile = path.join(runDir, `${prefix}_review_${name}_${suffix}.md`);
      console.log(`  [${name}] Reviewing...`);

      try {
        const result = await runAgent(agent.command, agent.args || [], prompt, (config.defaults.timeoutSeconds || 1800) * 1000);
        require("fs").writeFileSync(outputFile, result.stdout);
        console.log(`  [${name}] Done (${result.stdout.length} chars)`);
        return { agent: name, status: "ok" };
      } catch (err) {
        require("fs").writeFileSync(outputFile, `Error: ${err.message}`);
        console.log(`  [${name}] FAILED: ${err.message}`);
        return { agent: name, status: "failed" };
      }
    });

    const results = await Promise.allSettled(tasks);
    let ok = 0, fail = 0;
    for (const r of results) {
      if (r.value?.status === "ok") ok++;
      else if (r.value?.status !== "skipped") fail++;
    }
    console.log(`Review round ${round}: ${ok} succeeded, ${fail} failed`);
  }
}

async function runStage(config, promptsDir, runDir, stageId) {
  const stage = config.workflow.stages.find(s => s.id === stageId);
  if (!stage) throw new Error(`Stage "${stageId}" not found in workflow`);

  switch (stageId) {
    case "plan":
      throw new Error("Plan stage requires a topic. Use 'aicouncil plan <topic>' instead.");
    case "review":
      await runReviewStage(config, promptsDir, runDir, stage, skipAgents);
      break;
    default:
      console.log(`Stage "${stageId}" should be handled by the orchestrator (opencode).`);
      console.log(`No automated action for this stage.`);
  }
}

async function continueWorkflow(config, promptsDir, runDir, skipAgents = []) {
  const meta = readMeta(runDir);
  if (!meta.stage) meta.stage = "created";

  // Stage detection based on file existence + metadata
  const hasHumanAnswers = fileExists(runDir, "06_human_answers.md");
  const hasFinalPlan = fileExists(runDir, "07_final_plan.md");
  const hasReviewR1 = fileExists(runDir, "10_review_claude_round1.md") || fileExists(runDir, "10_review_codex_round1.md");
  const hasSynthesisV2 = fileExists(runDir, "11_deepseek_synthesis_v2.md");
  const hasReviewR2 = fileExists(runDir, "12_review_claude_round2.md") || fileExists(runDir, "12_review_codex_round2.md");
  const hasFinal = fileExists(runDir, "14_final.md");

  // Auto-detect stage advancement
  if (meta.stage === "waiting_human_answers" && hasHumanAnswers && hasFinalPlan) {
    meta.stage = "final_plan_done";
    writeMeta(runDir, meta);
  }
  if (meta.stage === "final_plan_done" && hasReviewR1) {
    meta.stage = "review_round_1_done";
    writeMeta(runDir, meta);
  }
  if (meta.stage === "review_round_1_done" && hasSynthesisV2) {
    meta.stage = "synthesis_v2_done";
    writeMeta(runDir, meta);
  }
  if (meta.stage === "synthesis_v2_done" && hasReviewR2) {
    meta.stage = "review_round_2_done";
    writeMeta(runDir, meta);
  }
  if (meta.stage === "review_round_2_done" && hasFinal) {
    meta.stage = "final_done";
    writeMeta(runDir, meta);
  }

  console.log(`Stage: ${meta.stage}`);

  switch (meta.stage) {
    case "created":
    case "planning_running":
      console.log("Run has not completed planning. Run 'aicouncil plan <topic>' first.");
      break;

    case "planning_done":
      meta.stage = "waiting_human_answers";
      writeMeta(runDir, meta);
      console.log("Planning complete. Next: ask opencode to run synthesis (04_synthesis.md + 05_questions_for_human.md)");
      break;
    case "waiting_human_answers":
      if (!hasHumanAnswers) {
        console.log("Waiting for 06_human_answers.md.\nEdit this file and re-run 'aicouncil continue'.");
      } else {
        console.log("06_human_answers.md found.\nNext: ask opencode to generate 07_final_plan.md / 08_implementation_prompt.md / 09_review_checklist.md");
      }
      break;

    case "final_plan_done":
      await runReviewStage(config, promptsDir, runDir, config.workflow.stages.find(s => s.id === "review") || { agents: ["claude", "codex"], rounds: 2 }, skipAgents);
      meta.stage = "review_round_1_done";
      meta.reviewRound1CompletedAt = new Date().toISOString();
      writeMeta(runDir, meta);
      console.log("\nNext: ask opencode to synthesize v2 from review round 1 results.");
      break;

    case "review_round_1_done":
      console.log("Review round 1 complete.\nNext: ask opencode to generate 11_deepseek_synthesis_v2.md");
      break;

    case "synthesis_v2_done":
      await runReviewStage(config, promptsDir, runDir, config.workflow.stages.find(s => s.id === "review") || { agents: ["claude", "codex"], rounds: 2 }, skipAgents);
      meta.stage = "review_round_2_done";
      meta.reviewRound2CompletedAt = new Date().toISOString();
      writeMeta(runDir, meta);
      console.log("\nNext: ask opencode to generate 13_final_questions_for_human.md and 14_final.md");
      break;

    case "review_round_2_done":
      console.log("All reviews complete.\nFinal step: ask opencode to generate 13_final_questions_for_human.md and 14_final.md");
      break;

    case "final_done":
      console.log("Run complete. See 14_final.md.");
      break;

    default:
      console.log(`Unknown stage: ${meta.stage}`);
  }
}

module.exports = { runPlanStage, runReviewStage, runStage, continueWorkflow };
