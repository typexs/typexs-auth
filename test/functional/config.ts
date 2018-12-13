let inc = 0;
export const LOGGING = {
  enable: false,
  level: 'debug',
  transports: [{console: {name: 'logger' + (inc++)}}]

};
