"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dashPrefixRegex = /^\-{1,2}/;
const jsonFileRegex = /\.json$/i;
exports.camelCaseCmd = cmd => cmd.replace(/-[a-z]/g, v => v.slice(1).toUpperCase());
function parseArgv(argv, options) {
    const parsedOptions = {};
    // set option defaults
    for (const [, cmd, type, def] of options) {
        if (def) {
            const defaultValue = def instanceof Function ? def() : def;
            parsedOptions[exports.camelCaseCmd(cmd)] = type ? type(defaultValue) : defaultValue;
        }
    }
    // parse argv
    const argvIter = argv.entries();
    for (const [index, argvItem] of argvIter) {
        // support assign operator, e.g. --my-var="hello world"
        let [arg, value] = argvItem.split('=', 2);
        // remove leading dashes
        arg = arg.replace(dashPrefixRegex, '');
        // find matching option
        const findOp = arg.length === 1 ? ([shortcmd]) => arg === shortcmd :
            ([shortcmd, cmd]) => arg === shortcmd || arg === cmd;
        const option = options.find(findOp);
        if (!option)
            throw new Error(`Unknown option "${arg}"`);
        const [, cmd, type] = option;
        // value should be next argv unless it's undefined, starts with dashes or ends with ".json"
        if (value === undefined &&
            !dashPrefixRegex.test(argv[index + 1]) &&
            (jsonFileRegex).test(argv[index + 1])) {
            value = argvIter.next().value[1];
        }
        value = value !== undefined ? value : true;
        parsedOptions[exports.camelCaseCmd(cmd)] = type ? type(value) : value;
    }
    return parsedOptions;
}
exports.parseArgv = parseArgv;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXJndi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9hcmd2LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQ0EsTUFBTSxlQUFlLEdBQUcsVUFBVSxDQUFDO0FBQ25DLE1BQU0sYUFBYSxHQUFHLFVBQVUsQ0FBQztBQUVwQixRQUFBLFlBQVksR0FBRyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO0FBRXpGLFNBQWdCLFNBQVMsQ0FBQyxJQUFjLEVBQUUsT0FBTztJQUMvQyxNQUFNLGFBQWEsR0FBRyxFQUFFLENBQUM7SUFFekIsc0JBQXNCO0lBQ3RCLEtBQUssTUFBTSxDQUFDLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxHQUFHLENBQUMsSUFBSSxPQUFPLEVBQUU7UUFDeEMsSUFBSSxHQUFHLEVBQUU7WUFDUCxNQUFNLFlBQVksR0FBRyxHQUFHLFlBQVksUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDO1lBQzNELGFBQWEsQ0FBQyxvQkFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQztTQUM3RTtLQUNGO0lBRUQsYUFBYTtJQUNiLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUNoQyxLQUFLLE1BQU0sQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLElBQUksUUFBUSxFQUFFO1FBQ3hDLHVEQUF1RDtRQUN2RCxJQUFJLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBaUIsQ0FBQztRQUMxRCx3QkFBd0I7UUFDeEIsR0FBRyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsZUFBZSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ3ZDLHVCQUF1QjtRQUN2QixNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxHQUFHLEtBQUssUUFBUSxDQUFDLENBQUM7WUFDbEUsQ0FBQyxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsRUFBRSxFQUFFLENBQUMsR0FBRyxLQUFLLFFBQVEsSUFBSSxHQUFHLEtBQUssR0FBRyxDQUFDO1FBRXZELE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDcEMsSUFBSSxDQUFDLE1BQU07WUFBRSxNQUFNLElBQUksS0FBSyxDQUFDLG1CQUFtQixHQUFHLEdBQUcsQ0FBQyxDQUFDO1FBRXhELE1BQU0sQ0FBQyxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRyxNQUFNLENBQUM7UUFDN0IsMkZBQTJGO1FBQzNGLElBQUksS0FBSyxLQUFLLFNBQVM7WUFDckIsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDdEMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFO1lBQ3ZDLEtBQUssR0FBRyxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ2xDO1FBQ0QsS0FBSyxHQUFHLEtBQUssS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1FBQzNDLGFBQWEsQ0FBQyxvQkFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztLQUMvRDtJQUVELE9BQU8sYUFBYSxDQUFDO0FBQ3ZCLENBQUM7QUFyQ0QsOEJBcUNDIn0=