import fs from "node:fs";
import path from "node:path";

let cachedConfig = null;

export function getTransitionsConfig() {
  if (!cachedConfig) {
    const configPath = path.resolve("transitions.config.json");
    cachedConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
  }
  return cachedConfig;
}

export function getTransition(transitionId) {
  const config = getTransitionsConfig();
  const allTransitions = [
    ...(config.controlTransitions || []),
    ...(config.cardTransitions || [])
  ];
  return allTransitions.find(t => t.id === transitionId) || null;
}

export function resolveSpring(transitionId, prefersReducedMotion = false) {
  const config = getTransitionsConfig();
  if (prefersReducedMotion) {
    return { ...config.reducedMotionFallback };
  }

  const transition = getTransition(transitionId);
  if (!transition) {
    throw new Error(`Unknown transition ID: ${transitionId}`);
  }

  const token = transition.springToken;
  const spring = config.springTokens[token];
  if (!spring) {
    throw new Error(`Unknown spring token: ${token} for transition ${transitionId}`);
  }

  return {
    type: "spring",
    stiffness: spring.stiffness,
    damping: spring.damping,
    mass: spring.mass
  };
}

export function validateTransitionRegistry(config) {
  if (!config.springTokens || typeof config.springTokens !== "object") {
    throw new Error("Missing springTokens dictionary");
  }
  const requiredTokens = ["snap", "tactile", "glide", "heavy", "gentle"];
  for (const token of requiredTokens) {
    if (!config.springTokens[token]) {
      throw new Error(`Missing required spring token: ${token}`);
    }
  }

  if (!config.reducedMotionFallback || config.reducedMotionFallback.duration !== 0) {
    throw new Error("reducedMotionFallback must specify duration: 0");
  }

  const transitions = [
    ...(config.controlTransitions || []),
    ...(config.cardTransitions || [])
  ];

  if (transitions.length === 0) {
    throw new Error("Registry must contain transitions");
  }

  for (const t of transitions) {
    if (!t.id || !t.from || !t.to || !t.springToken) {
      throw new Error(`Malformed transition entry: ${JSON.stringify(t)}`);
    }
    if (!config.springTokens[t.springToken]) {
      throw new Error(`Transition ${t.id} references non-existent spring token ${t.springToken}`);
    }
  }
  return true;
}
