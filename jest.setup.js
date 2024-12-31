global.fail = (reason = "test failed") => {
    throw new Error(reason);
  };
  