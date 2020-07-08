/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { expect } from 'chai';

import {
  extractDeclarations,
  MemberList,
  dedup,
  mapSymbolToType,
  replaceAll,
  writeReportToFile,
  ErrorCode,
  writeReportToDirectory,
  extractExternalDependencies
} from './analysis-helper';

import { retrieveTestModuleDtsFile } from './test-utils';
import { exec } from 'child_process';
import * as fs from 'fs';
import { resolve } from 'path';

describe('extractDeclarations', () => {
  let testModuleDtsFile: string;
  let extractedDeclarations: MemberList;
  before(function() {
    this.timeout(300000);
    testModuleDtsFile = retrieveTestModuleDtsFile();
    extractedDeclarations = extractDeclarations(testModuleDtsFile);
  });
  it('test basic variable extractions', () => {
    expect(extractedDeclarations.variables).to.include.members([
      'basicVarDeclarationExport',
      'basicVarStatementExport',
      'reExportVarStatmentExport'
    ]);
  });

  it('test re-exported variable extractions from same module', () => {
    expect(extractedDeclarations.variables).to.include.members([
      'basicVarDeclarationExportFar',
      'basicVarStatementExportFar',
      'reExportVarStatmentExportFar',
      'basicVarDeclarationExportBar',
      'basicVarStatementExportBar',
      'reExportVarStatmentExportBar'
    ]);
  });

  it('test basic function extractions', () => {
    expect(extractedDeclarations.functions).to.include.members([
      'basicFuncExportNoDependencies',
      'basicFuncExportVarDependencies',
      'basicFuncExportFuncDependencies',
      'basicFuncExportEnumDependencies',
      'basicFuncExternalDependencies'
    ]);
  });
  it('test basic function de-duplication ', () => {
    expect(extractedDeclarations.functions).include.members([
      'basicUniqueFunc'
    ]);

    expect(
      extractedDeclarations.functions.filter(
        each => each.localeCompare('basicUniqueFunc') === 0
      ).length
    ).to.equal(1);
  });

  it('test re-exported function extractions from same module', () => {
    expect(extractedDeclarations.functions).to.include.members([
      'basicFuncExportNoDependenciesFar',
      'basicFuncExportVarDependenciesFar',
      'basicFuncExportFuncDependenciesFar',
      'basicFuncExportEnumDependenciesFar',
      'basicFuncExternalDependenciesFar',
      'basicFuncExportNoDependenciesBar',
      'basicFuncExportVarDependenciesBar',
      'basicFuncExportFuncDependenciesBar',
      'basicFuncExportEnumDependenciesBar',
      'basicFuncExternalDependenciesBar'
    ]);
  });

  it('test re-exported function de-duplication from same module ', () => {
    expect(extractedDeclarations.functions).include.members([
      'basicUniqueFuncFar'
    ]);

    expect(
      extractedDeclarations.functions.filter(
        each => each.localeCompare('basicUniqueFuncFar') === 0
      ).length
    ).to.equal(1);
  });

  it('test basic class extractions', () => {
    expect(extractedDeclarations.classes).to.include.members([
      'BasicClassExport'
    ]);
  });

  it('test re-exported class extractions from same module', () => {
    expect(extractedDeclarations.classes).to.include.members([
      'BasicClassExportFar',
      'BasicClassExportBar'
    ]);
  });

  it('test basic enum extractions', () => {
    expect(extractedDeclarations.enums).to.include.members(['BasicEnumExport']);
  });

  it('test re-exported enum extractions from same module', () => {
    expect(extractedDeclarations.enums).to.include.members([
      'BasicEnumExportFar',
      'BasicEnumExportBar'
    ]);
  });

  it('test re-exported enum extractions from firebase external module', () => {
    expect(extractedDeclarations.enums).to.include.members(['LogLevel']);
  });
});

xdescribe('test command line interface', () => {
  it('test adhoc run valid flag combinations', () => {
    expect(async () => {
      exec(
        '../../node_modules/.bin/ts-node-script analysis.ts --if "../../packages-exp/dummy-exp/dist/packages-exp/dummy-exp/src/index.d.ts" -o "./dependencies/dependencies/adhoc.json"',
        (err, stdout, stderr) => {
          if (err) {
            throw err;
          } else if (stderr) {
            throw new Error(stderr);
          }
        }
      );
    }).to.throw();
  });
});

describe('test dedup helper function', () => {
  it('test dedup with non-empty entries', () => {
    let memberList: MemberList = {
      functions: ['aFunc', 'aFunc', 'bFunc', 'cFunc'],
      classes: ['aClass', 'bClass', 'aClass', 'cClass'],
      variables: ['aVar', 'bVar', 'cVar', 'aVar'],
      enums: ['aEnum', 'bEnum', 'cEnum', 'dEnum'],
      externals: []
    };
    memberList = dedup(memberList);

    expect(memberList.functions).to.have.length(3);
    expect(memberList.classes).to.have.length(3);
    expect(memberList.variables).to.have.length(3);
    expect(memberList.enums).to.have.length(4);
    expect(
      memberList.functions.filter(each => each.localeCompare('aFunc') === 0)
        .length
    ).to.equal(1);
    expect(
      memberList.classes.filter(each => each.localeCompare('aClass') === 0)
        .length
    ).to.equal(1);
    expect(
      memberList.variables.filter(each => each.localeCompare('aVar') === 0)
        .length
    ).to.equal(1);
    expect(
      memberList.enums.filter(each => each.localeCompare('aEnum') === 0).length
    ).to.equal(1);
  });

  it('test dedup with empty entries', () => {
    let memberList: MemberList = {
      functions: [],
      classes: [],
      variables: ['aVar', 'bVar', 'cVar', 'aVar'],
      enums: [],
      externals: []
    };
    memberList = dedup(memberList);
    expect(memberList.functions).to.have.length(0);
    expect(memberList.classes).to.have.length(0);
    expect(memberList.enums).to.have.length(0);
    expect(memberList.variables).to.have.length(3);

    expect(
      memberList.variables.filter(each => each.localeCompare('aVar') === 0)
        .length
    ).to.equal(1);
  });
});

describe('test replaceAll helper function', () => {
  it('test replaceAll with multiple occurences of an element', () => {
    const memberList: MemberList = {
      functions: ['aFunc', 'aFunc', 'bFunc', 'cFunc'],
      classes: ['aClass', 'bClass', 'aClass', 'cClass'],
      variables: ['aVar', 'bVar', 'cVar', 'aVar'],
      enums: ['aEnum', 'bEnum', 'cEnum', 'dEnum'],
      externals: []
    };
    const original: string = 'aFunc';
    const replaceTo: string = 'replacedFunc';
    replaceAll(memberList, original, replaceTo);
    expect(memberList.functions).to.not.include.members([original]);
    expect(memberList.functions).to.include.members([replaceTo]);
    expect(memberList.functions).to.have.length(4);
    expect(
      memberList.functions.filter(each => each.localeCompare(original) === 0)
        .length
    ).to.equal(0);
    expect(
      memberList.functions.filter(each => each.localeCompare(replaceTo) === 0)
        .length
    ).to.equal(2);
  });

  it('test replaceAll with single occurence of an element', () => {
    const memberList: MemberList = {
      functions: ['aFunc', 'aFunc', 'bFunc', 'cFunc'],
      classes: ['aClass', 'bClass', 'aClass', 'cClass'],
      variables: ['aVar', 'bVar', 'cVar', 'aVar'],
      enums: ['aEnum', 'bEnum', 'cEnum', 'dEnum'],
      externals: []
    };
    const replaceTo: string = 'replacedClass';
    const original: string = 'bClass';
    replaceAll(memberList, original, replaceTo);
    expect(memberList.classes).to.not.include.members([original]);
    expect(memberList.classes).to.include.members([replaceTo]);
    expect(memberList.classes).to.have.length(4);
    expect(
      memberList.classes.filter(each => each.localeCompare(original) === 0)
        .length
    ).to.equal(0);
    expect(
      memberList.classes.filter(each => each.localeCompare(replaceTo) === 0)
        .length
    ).to.equal(1);
  });

  it('test replaceAll with zero occurence of an element', () => {
    const memberList: MemberList = {
      functions: ['aFunc', 'aFunc', 'bFunc', 'cFunc'],
      classes: ['aClass', 'bClass', 'aClass', 'cClass'],
      variables: ['aVar', 'bVar', 'cVar', 'aVar'],
      enums: ['aEnum', 'bEnum', 'cEnum', 'dEnum'],
      externals: []
    };
    const replaceTo: string = 'replacedEnum';
    const original: string = 'eEnum';
    replaceAll(memberList, original, replaceTo);
    expect(memberList.enums).to.not.include.members([original, replaceTo]);
    expect(memberList.enums).to.have.length(4);
    expect(
      memberList.enums.filter(each => each.localeCompare(original) === 0).length
    ).to.equal(0);
    expect(
      memberList.enums.filter(each => each.localeCompare(replaceTo) === 0)
        .length
    ).to.equal(0);
  });
});

describe('test mapSymbolToType helper function', () => {
  it('test if function correctly categorizes symbols that are misplaced', () => {
    let memberList: MemberList = {
      functions: ['aVar', 'bFunc', 'cFunc'],
      classes: ['bClass', 'cClass'],
      variables: ['aClass', 'bVar', 'cVar', 'aEnum'],
      enums: ['bEnum', 'cEnum', 'dEnum', 'aFunc'],
      externals: []
    };

    const map: Map<string, string> = new Map([
      ['aFunc', 'functions'],
      ['bFunc', 'functions'],
      ['aClass', 'classes'],
      ['bClass', 'classes'],
      ['aVar', 'variables'],
      ['bVar', 'variables'],
      ['aEnum', 'enums']
    ]);

    memberList = mapSymbolToType(map, memberList);

    expect(memberList.functions).to.have.members(['aFunc', 'bFunc', 'cFunc']);
    expect(memberList.functions).to.not.include.members(['aVar']);
    expect(memberList.classes).to.have.members(['aClass', 'bClass', 'cClass']);
    expect(memberList.variables).to.not.include.members(['aClass', 'aEnum']);
    expect(memberList.variables).to.have.members(['aVar', 'bVar', 'cVar']);
    expect(memberList.enums).to.have.members([
      'aEnum',
      'bEnum',
      'cEnum',
      'dEnum'
    ]);
    expect(memberList.enums).to.not.include.members(['aFunc']);

    expect(memberList.functions).to.have.length(3);
    expect(memberList.classes).to.have.length(3);
    expect(memberList.variables).to.have.length(3);
    expect(memberList.enums).to.have.length(4);
  });
});

describe('test writeReportToFile helper function', () => {
  it('should throw error when given path exists and points to directory', () => {
    const aDir = resolve('./a-dir/a-sub-dir');
    fs.mkdirSync(aDir, { recursive: true });
    expect(() => writeReportToFile('content', aDir)).to.throw(
      ErrorCode.OUTPUT_FILE_REQUIRED
    );
  });

  it('should not throw error when given path does not pre-exist', () => {
    const aPathToFile = resolve('./a-dir/a-sub-dir/a-file');
    expect(() => writeReportToFile('content', aPathToFile)).to.not.throw();
    fs.unlinkSync(aPathToFile);
  });
  after(() => {
    fs.rmdirSync('a-dir', { recursive: true });
  });
});

describe('test writeReportToDirectory helper function', () => {
  it('should throw error when given path exists and points to a file', () => {
    const aDir = resolve('./a-dir/a-sub-dir');
    fs.mkdirSync(aDir, { recursive: true });
    const aFile = `a-file`;
    const aPathToFile = `${aDir}/${aFile}`;
    fs.writeFileSync(aPathToFile, 'content');
    expect(() =>
      writeReportToDirectory('content', aFile, aPathToFile)
    ).to.throw(ErrorCode.OUTPUT_DIRECTORY_REQUIRED);
  });

  it('should not throw error when given path does not pre-exist', () => {
    const aDir = resolve('./a-dir/a-sub-dir');
    const aFile = `a-file`;
    expect(() => writeReportToDirectory('content', aFile, aDir)).to.not.throw();
  });
  after(() => {
    fs.unlinkSync(`${resolve('./a-dir/a-sub-dir')}/a-file`);
    fs.rmdirSync('a-dir', { recursive: true });
  });
});

describe('test extractExternalDependencies helper function', () => {
  it('should correctly extract all symbols listed in import statements', () => {
    const assortedImports: string = resolve('./src/assortedImports.js');
    const externals: object = extractExternalDependencies(assortedImports);
    expect(externals).to.not.have.property("'@firebase/logger'");
    expect(externals).to.have.property("'./bar'");
    expect(externals["'./bar'"]).to.have.members([
      'basicFuncExternalDependenciesBar',
      'basicFuncExportEnumDependenciesBar'
    ]);
    expect(externals).to.have.property("'fs'");
    expect(externals["'fs'"]).to.have.members(['fs']);
    expect(externals).to.have.property("'../package.json'");
    expect(externals["'../package.json'"]).to.have.members(['version']);
  });
});
