import {storage} from './kv';
import {RecordRepository} from './recordRepository';
export class Repository extends RecordRepository{constructor(scope:string){super(scope,storage);}}
export type {WorkspaceCache} from './recordRepository';
