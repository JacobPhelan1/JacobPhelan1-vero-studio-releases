import test from"node:test";import assert from"node:assert/strict";import{newProduction,migrateProduction,PRODUCTION_SCHEMA_VERSION}from"../src/types/production.js";
test("creates stable versioned production references",()=>{const p=newProduction({productionName:"Game",sport:"Football"});assert.equal(p.schemaVersion,PRODUCTION_SCHEMA_VERSION);assert.equal(p.productionName,"Game");assert.equal(p.homeTeamId,null);assert.ok(p.productionId);});
test("rejects future schemas",()=>assert.throws(()=>migrateProduction({schemaVersion:999}),/newer/));
