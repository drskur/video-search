import { nx_monorepo } from "aws-prototyping-sdk";
import { PDKPipelineTsProject } from "aws-prototyping-sdk/pipeline";

const project = new nx_monorepo.NxMonorepoProject({
  defaultReleaseBranch: "main",
  devDeps: ["aws-prototyping-sdk"],
  name: "video-search",
  description: "This repo is a sample video search app using AWS services.",
  deps: [],
  license: "MIT",
  copyrightOwner: "drskur<drskur@amazon.com>",
  tsconfig: {
    compilerOptions: {
      rootDir: undefined,
    },
  },
});
project.addGitIgnore(".idea");

new PDKPipelineTsProject({
  parent: project,
  outdir: "packages/infra",
  defaultReleaseBranch: "main",
  name: "infra",
  cdkVersion: "2.1.0",
});

project.synth();
