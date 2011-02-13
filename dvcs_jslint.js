/*jslint strict: false, plusplus: false */
/*global Packages: false */

var jslintPath = process.argv[2],
    repoType = process.argv[3],
    exec = require('child_process').exec,
    utils = require("util"),
    jsExtRegExp = /\.js\s*$/,
    okRegExp = /No problems found/,
    gitModRegExp = /(new file|modified)\:\s*(\S+\.js)\s*/,
    gitNotUpdated = "Changed but not updated",
    gitUntracked = "Untracked files:",
    cmd = "node " + jslintPath + " ",
    dvCmd = repoType == "hg" ? "hg status" : "git status";

if (repoType !== "hg" && repoType !== "git") {
    throw "Unsupported repo type: " + repoType + ". Valid values are hg or git.";
}
//Get list of changed files.
exec(dvCmd, function (error, stdout, stderr) {
  processStatus(stdout.split("\n"));
});

var processStatus = function (lines) {
  var fn;
  if (lines.length) {
    if (repoType === "hg") {
      fn = getHgFiles;
    } else if (repoType === "git") {
      fn = getGitFiles
    }
    processFiles(fn(lines));
  }
};
var getHgFiles = function (lines) {
  var files = [];
  lines.forEach(function (line) {
    if ((line.charAt(0) === "A" || line.charAt(0) === "M") && 
        jsExtRegExp.test(line)) {
      //Added or modified JS file, add to list.
      files.push(line.substring(2, line.length));
    }
  });
  return files;
};
var getGitFiles = function (lines) {
  var files = [];
  lines.forEach(function (line) {
    if ((line.indexOf(gitNotUpdated) !== -1) || 
        (line.indexOf(gitUntracked) !== -1)) {
      return;
    }
    var match = gitModRegExp.exec(line);
    if (match) {
      files.push(match[2]);
    }
  });
  return files;
};
var processFiles = function (files) {
  files.forEach(function (file) {
    exec(cmd + file, function (error, stdout, stderr) {
      if (!okRegExp.test(stdout)) {
        throw "JSLint error in " + file + ":\n" + stdout;
      }
    });
  });
};