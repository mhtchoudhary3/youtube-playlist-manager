module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        targets: {
          node: "current",
          modules: "auto", // This ensures Babel handles ES modules
        },
      },
    ],
  ],
};
