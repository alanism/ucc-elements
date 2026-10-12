/**
 * Receipt Schema & Verifier Logic
 * In accordance with Build Plan rd03 §10.1 & Gate T34
 */

export const ALLOWED_EVIDENCE_MODES = new Set([
  'ci_unit',
  'ci_integration',
  'ci_browser',
  'real_device',
  'manual_pilot',
  'mock'
]);

export function validateGateReceipt(receipt, gateConfig) {
  if (!receipt || typeof receipt !== 'object') {
    throw new Error('Receipt must be an object');
  }

  const requiredFields = [
    'runId',
    'gateId',
    'phase',
    'evidenceMode',
    'codeHash',
    'configHash',
    'sampleSize',
    'observedValue',
    'status',
    'timestamp'
  ];

  for (const field of requiredFields) {
    if (!(field in receipt) || receipt[field] === undefined || receipt[field] === '') {
      throw new Error(`Receipt missing required field: ${field}`);
    }
  }

  if (gateConfig && receipt.gateId !== gateConfig.id) {
    throw new Error(`Receipt gateId ${receipt.gateId} does not match target gate ${gateConfig.id}`);
  }

  if (!ALLOWED_EVIDENCE_MODES.has(receipt.evidenceMode)) {
    throw new Error(`Invalid evidenceMode: ${receipt.evidenceMode}`);
  }

  // T34 Invariant: Mocks CANNOT satisfy device_lab or manual_pilot gates!
  if (gateConfig) {
    const isDeviceGate = gateConfig.tiers.includes('device');
    const isPilotGate = gateConfig.tiers.includes('manual_pilot');

    if ((isDeviceGate || isPilotGate) && receipt.evidenceMode === 'mock') {
      throw new Error(`Gate ${gateConfig.id} requires actual ${isPilotGate ? 'manual_pilot' : 'device'} evidence; mock is prohibited`);
    }

    // Manual pilot gates require explicit signedBy evaluator
    if (isPilotGate && (!receipt.signedBy || typeof receipt.signedBy !== 'string' || receipt.signedBy.trim() === '')) {
      throw new Error(`Manual pilot gate ${gateConfig.id} requires valid signedBy attribute`);
    }

    // Verify sample size requirement
    if (receipt.sampleSize < gateConfig.minSampleSize) {
      throw new Error(`Receipt sampleSize ${receipt.sampleSize} is below required minimum ${gateConfig.minSampleSize}`);
    }

    // Verify mathematical comparator logic
    const pass = evaluateComparator(receipt.observedValue, gateConfig.comparator, gateConfig.target);
    if (!pass && receipt.status === 'passed') {
      throw new Error(`Receipt falsely claims status "passed" when observed ${receipt.observedValue} fails ${gateConfig.comparator} ${gateConfig.target}`);
    }
    if (pass && receipt.status !== 'passed') {
      throw new Error(`Receipt observed value satisfies target but status is ${receipt.status}`);
    }
  }

  return true;
}

export function evaluateComparator(observed, comparator, target) {
  switch (comparator) {
    case '==': return observed === target;
    case '<': return observed < target;
    case '<=': return observed <= target;
    case '>': return observed > target;
    case '>=': return observed >= target;
    default:
      throw new Error(`Unsupported comparator: ${comparator}`);
  }
}
