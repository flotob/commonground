/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testRegex: ".*\\.spec\\.js$",
  moduleFileExtensions: ["js"],
  moduleDirectories: [
    "node_modules",
    "__tmp"
  ],
  verbose: true,
  bail: true
};
