import { Command } from "commander";
import { render } from "ink";
import React from "react";
import { HomePage } from "../page/home-page";

const program = new Command();

program
  .name("infer-scan")
  .description("Inference scanning tool")
  .version("1.0.0");

program
  .command("start")
  .description("Start the interactive UI")
  .action(() => {
    render(React.createElement(HomePage));
  });

program
  .command("scan")
  .description("Run a scan")
  .option("-t, --target <target>", "Target to scan")
  .action((opts) => {
    console.log(`Scanning target: ${opts.target || "default"}`);
  });

program
  .command("config")
  .description("Show configuration")
  .action(() => {
    console.log("Configuration: default");
  });

export { program };
