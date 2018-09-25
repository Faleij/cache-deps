
const dashPrefixRegex = /^\-{1,2}/;
const jsonFileRegex = /\.json$/i;

export const camelCaseCmd = cmd => cmd.replace(/-[a-z]/g, v => v.slice(1).toUpperCase());

export function parseArgv(argv: string[], options): any {
  const parsedOptions = {};

  // set option defaults
  for (const [, cmd, type, def] of options) {
    if (def) {
      const defaultValue = def instanceof Function ? def() : def;
      parsedOptions[camelCaseCmd(cmd)] = type ? type(defaultValue) : defaultValue;
    }
  }

  // parse argv
  const argvIter = argv.entries();
  for (const [index, argvItem] of argvIter) {
    // support assign operator, e.g. --my-var="hello world"
    let [arg, value] = argvItem.split('=', 2) as[string, any];
    // remove leading dashes
    arg = arg.replace(dashPrefixRegex, '');
    // find matching option
    const findOp = arg.length === 1 ? ([shortcmd]) => arg === shortcmd :
      ([shortcmd, cmd]) => arg === shortcmd || arg === cmd;

    const option = options.find(findOp);
    if (!option) throw new Error(`Unknown option "${arg}"`);

    const [, cmd, type] = option;
    // value should be next argv unless it's undefined, starts with dashes or ends with ".json"
    if (value === undefined &&
      !dashPrefixRegex.test(argv[index + 1]) &&
      (jsonFileRegex).test(argv[index + 1])) {
      value = argvIter.next().value[1];
    }
    value = value !== undefined ? value : true;
    parsedOptions[camelCaseCmd(cmd)] = type ? type(value) : value;
  }

  return parsedOptions;
}
