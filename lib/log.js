import chalk from 'chalk';
export const log = (message, emoji, step, maxStep) => console.log(chalk.gray(`[${step}/${maxStep}]`), `${chalk.reset(emoji)}  ${chalk.reset(message)}...`);
