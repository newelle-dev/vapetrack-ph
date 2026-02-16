---
name: mandatory
description: This prompt is designed to instruct the agent to work autonomously by following a research guide to gather context. The agent will use the #tool:runSubagent tool to perform this task and return all findings. It is important that no other tool calls are made after #tool:runSubagent returns.
---
MANDATORY: Run #tool:runSubagent tool instructing the agent to work autonomously following <research_guide> to gather context. Return all findings.

DO NOT do any other tool calls after #tool:runSubagent returns!

If #tool:runSubagent is unavailable, execute