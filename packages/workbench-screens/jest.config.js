/*
 *  Copyright 2019 Red Hat, Inc. and/or its affiliates.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

const path = require("path");
const parentConfig = require(path.resolve("../../jest.config.js"));

parentConfig.defaults.setupFiles = ["./test-env/jest-env-setup.js"];
parentConfig.defaults.snapshotSerializers = ["<rootDir>/node_modules/enzyme-to-json/serializer"];

if (!parentConfig.defaults.globals) {
  parentConfig.defaults.globals = {}
}

if (!parentConfig.defaults.globals['ts-jest']) {
  parentConfig.defaults.globals['ts-jest'] = {};
}

parentConfig.defaults.globals['ts-jest'].diagnostics = {
  pathRegex: ".*.test.tsx?$"
};

module.exports = parentConfig.defaults;
