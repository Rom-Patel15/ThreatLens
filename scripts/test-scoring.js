// Quick test of scoring calibration
// Run with: node test-scoring.js

const fs = require('fs');
const path = require('path');

// Load the compiled rule engine
const ruleEngine = require('./apps/api/dist/src/services/ruleEngine.js');

const testCases = [
  {
    name: "Fake PayPal Login URL",
    input: "http://paypaI-security-verification-login.xyz/update-account",
    scanType: "URL",
    expected: "MALICIOUS"
  },
  {
    name: "Crypto Wallet Seed Phrase Scam",
    input: "Your crypto wallet has been compromised. Verify your seed phrase immediately.",
    scanType: "TEXT",
    expected: "MALICIOUS"
  },
  {
    name: "Malicious ZIP Invoice",
    input: "Download attached invoice-payment-review.zip",
    scanType: "TEXT",
    expected: "HIGH or MALICIOUS"
  },
  {
    name: "Crypto Giveaway Scam",
    input: "Congratulations! Claim your iPhone by paying ₹99.",
    scanType: "TEXT",
    expected: "HIGH"
  },
  {
    name: "Wikipedia (legitimate)",
    input: "https://wikipedia.org",
    scanType: "URL",
    expected: "LOW"
  }
];

console.log("=== ThreatLens Scoring Calibration Test ===\n");

testCases.forEach(testCase => {
  try {
    const result = ruleEngine.runRuleEngine(testCase.input, testCase.scanType);
    
    const pass = result.trustRiskLevel === testCase.expected || 
                 (testCase.expected === "HIGH or MALICIOUS" && 
                  (result.trustRiskLevel === "HIGH" || result.trustRiskLevel === "MALICIOUS"));
    
    const status = pass ? "✓ PASS" : "✗ FAIL";
    
    console.log(`${status} - ${testCase.name}`);
    console.log(`  Input: "${testCase.input.substring(0, 60)}${testCase.input.length > 60 ? '...' : ''}"`);
    console.log(`  Score: ${result.scamProbability}/100 → ${result.trustRiskLevel}`);
    console.log(`  Expected: ${testCase.expected}`);
    console.log(`  Confidence: ${result.confidenceScore}%`);
    console.log(`  Signal Families: ${result.signals.signalFamilies}`);
    console.log(`  Classifications: ${result.attackClassifications.join(", ")}`);
    console.log(`  Indicators: ${result.phishingIndicators.slice(0, 2).join("; ")}`);
    console.log();
  } catch (err) {
    console.log(`✗ ERROR - ${testCase.name}`);
    console.log(`  Error: ${err.message}`);
    console.log();
  }
});
