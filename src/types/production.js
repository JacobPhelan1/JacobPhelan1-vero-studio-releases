export const PRODUCTION_SCHEMA_VERSION = 2;
const id=()=>crypto.randomUUID();
export const defaultInputs=()=>[
  {id:id(),name:"Camera 1",type:"camera",source:"",color:"#102832",audio:{enabled:true,muted:false,volume:100}},
  {id:id(),name:"Media 1",type:"video",source:"",color:"#14202a",audio:{enabled:true,muted:false,volume:100}},
  {id:id(),name:"Browser 1",type:"browser",source:"",color:"#17232d",audio:{enabled:false,muted:true,volume:100}},
  {id:id(),name:"VERO GFX",type:"gfx",source:"http://127.0.0.1:43110",color:"#063743",audio:{enabled:false,muted:true,volume:100}},
];
export function newProduction(input = {}) { const now=new Date().toISOString(); return { schemaVersion:PRODUCTION_SCHEMA_VERSION,productionId:id(),productionName:input.productionName?.trim()||"Untitled Production",workspaceId:null,accountId:null,eventId:null,eventName:input.eventName?.trim()||"",sport:input.sport?.trim()||"",homeTeamId:null,awayTeamId:null,date:input.date||now.slice(0,10),venue:input.venue?.trim()||"",graphicsPackageId:null,inputConfiguration:{inputs:defaultInputs(),previewInputId:null,programInputId:null},transitionConfiguration:{type:"Fade",durationMs:500},audioConfiguration:{master:{muted:false,volume:100}},connections:{gfx:null,replay:null,audio:null},settings:{},createdAt:now,updatedAt:now}; }
export function migrateProduction(value){if(!value||typeof value!=="object")throw new Error("Production file is invalid.");const version=value.schemaVersion||1;if(version>PRODUCTION_SCHEMA_VERSION)throw new Error("This production was created by a newer VERO Studio version.");const migrated={...newProduction({productionName:value.productionName}),...value,schemaVersion:PRODUCTION_SCHEMA_VERSION};if(version<2)migrated.inputConfiguration={inputs:value.inputConfiguration?.inputs?.length?value.inputConfiguration.inputs:defaultInputs(),previewInputId:null,programInputId:null};return migrated;}
