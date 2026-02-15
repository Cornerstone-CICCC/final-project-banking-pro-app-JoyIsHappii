// Setup file for Jest tests
// This file provides utilities for testing

let testData = { accounts: [] };
let mockInputs = [];
let inputIndex = 0;

global.__setData = (newData) => {
  testData = newData;
};

global.__getData = () => {
  return testData;
};

global.__resetData = () => {
  testData = { accounts: [] };
  inputIndex = 0;
};

// Mock the ask function to return predefined responses
global.__setMockInputs = (inputs) => {
  mockInputs = inputs;
  inputIndex = 0;
};

global.__getMockInput = () => {
  if (inputIndex < mockInputs.length) {
    return mockInputs[inputIndex++];
  }
  return '';
};

// Helper to prepare test - sets data and loads it into the module
global.__prepareTest = (data) => {
  global.__setData(data);
  // Import the module to trigger data loading
  const mod = require('../src/index.js');
  // Load data will read from __getData() because we're in test mode
};

// Store references to modules for mocking
global.__inTestMode = true;


