// create.test.js

const fs = require('fs');
const path = require('path');

// Mock the fs.writeFileSync function to avoid actually creating files during testing.
jest.mock('fs', () => ({
  writeFileSync: jest.fn(),
}));

// Mock the prompt function used in createFile to avoid actual user input during testing.
jest.mock('prompt-sync', () => jest.fn().mockReturnValue('1')); // Mock the user input choice to '1'.

// Import the createFile function from your main code file.
const { createFile } = require('./filesystem_final_node'); // Replace './fileSystem' with the correct relative path to your main code file.

// Initialize the fileSystem object for testing
let fileSystem = {};

// Test the createFile function
describe('createFile function', () => {
  beforeEach(() => {
    // Reset the fileSystem object before each test case
    fileSystem = {};
  });

  it('should create a file in the current working directory', () => {
    const filePath = 'test.txt'; // The file path to be used for testing
    const content = 'This is a test file.'; // Content to be used for testing
    const user = 'admin'; // User to be used for testing

    // Call the createFile function
    createFile(filePath, content, user);

    // Assertions
    expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      path.join(process.cwd(), filePath),
      content,
      'utf8'
    );
    expect(fileSystem[path.join(process.cwd(), filePath)]).toBeDefined();
  });

  it('should throw an error if file already exists', () => {
    // Prepare a sample existing file in the fileSystem
    const existingFilePath = 'existing_file.txt';
    fileSystem[existingFilePath] = { type: 'file', user: 'admin', permissions: { read: true, write: true } };

    const filePath = existingFilePath; // Use the existing file path for testing
    const content = 'This is a test file.'; // Content to be used for testing
    const user = 'admin'; // User to be used for testing

    // Call the createFile function and expect it to throw an error
    expect(() => createFile(filePath, content, user)).toThrowError('File already exists. Please provide a different file name or path.');
  });

  // Add more test cases to cover other scenarios as needed.
});
