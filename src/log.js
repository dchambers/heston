let log = () => null;

export const setLogger = (logger) => {
  log = logger;
};

export default (msg) => {
  log(msg);
};
