module.exports = {
    transform: {
      '^.+\\.js$': 'babel-jest', // This tells Jest to use Babel to transform JavaScript files
    },
    transformIgnorePatterns: [
      '/node_modules/', 
    ],
  };
  