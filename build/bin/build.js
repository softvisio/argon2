#!/usr/bin/env node

import { resolve } from "#core/utils";
import path from "path";
import fs from "fs";
import glob from "#core/glob";
import childProcess from "child_process";
import ExternalResourcesBuilder from "#core/external-resources/builder";
import { readConfig } from "#core/config";

// find uws location
const cwd = path.dirname( resolve( "argon2/package.json", import.meta.url ) );

// install argon2 deps
const res = childProcess.spawnSync( "npm", ["i"], {
    cwd,
    "shell": true,
    "stdio": "inherit",
} );
if ( res.status ) process.exit( res.status );

const id = "softvisio-node/argin2/resources";

const meta = { "version": readConfig( cwd + "/package.json" ).version };

class ExternalResource extends ExternalResourcesBuilder {
    #file;
    #name;

    constructor ( file, name ) {
        super( id + "/" + name );

        this.#file = file;
        this.#name = name;
    }

    async _getEtag () {
        return result( 200, await this._getFileHash( this.#file ) );
    }

    async _build ( location ) {
        fs.copyFileSync( this.#file, location + "/" + this.#name );

        return result( 200 );
    }

    async _getMeta () {
        return meta;
    }
}

for ( const file of glob( "lib/binding/*/*.node", { cwd } ) ) {
    const napi = path.basename( path.dirname( file ) ),
        name = `${napi}-${process.platform}-${process.arch}.node`;

    const resource = new ExternalResource( cwd + "/" + file, name );

    const res = await resource.build();

    if ( !res.ok ) process.exit( 1 );
}
