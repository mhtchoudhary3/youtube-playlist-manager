// Example of different colors using ANSI escape codes

// Reset code
const reset = "\x1b[0m";

// Text color codes
const red = "\x1b[31m";
const green = "\x1b[32m";
const yellow = "\x1b[33m";
const blue = "\x1b[34m";
const magenta = "\x1b[35m";
const cyan = "\x1b[36m";
const white = "\x1b[37m";
const blackText = "\x1b[30m"; // Black text

// Background color codes
const bgRed = "\x1b[41m";
const bgGreen = "\x1b[42m";
const bgYellow = "\x1b[43m";
const bgBlue = "\x1b[44m";
const whiteBackground = "\x1b[48;5;15m"; // White background

// Usage example
// console.log(`${green}This is a green message${reset}`);
// console.log(`${red}This is a red message${reset}`);
// console.log(`${yellow}This is a yellow message${reset}`);
// console.log(`${blue}This is a blue message${reset}`);
// console.log(`${magenta}This is a magenta message${reset}`);
// console.log(`${cyan}This is a cyan message${reset}`);
// console.log(`${bgRed}${white}This is text with a red background${reset}`);

// Function to log errors in red
export function logError(msg, error = null) {
  //  let errorDetails = error ? `- ${error.message}` : '';
  console.log(`${red}Error: ${reset} ${msg} ${error}`);
}

// Function to log info messages in green
export function logInfo(msg) {
  console.log(`${green}Info : ${reset} ${msg}`);
}

// Function to log debug messages in yellow
export function logDebug(msg) {
  console.log(`${yellow}Debug : ${reset} ${msg}`);
}

// Function to log summary messages with a white background and black text
export function logSummary(msg) {
  console.log(`${whiteBackground}${blackText} Summary: ${msg} ${reset}`);
}
