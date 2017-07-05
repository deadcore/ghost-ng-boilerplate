const express = require('express');
const logging = require('ghost/core/server/logging');
const errors = require('ghost/core/server/errors');
const utils = require('ghost/core/server/utils');
const ghost = require('ghost/core');

class GhostBootstrap {

    constructor() {
        this.parentApp = express();
    }

    start() {
        return ghost().then(ghostServer => {
            // Mount our Ghost instance on our desired subdirectory path if it exists.
            this.parentApp.use(utils.url.getSubdir(), ghostServer.rootApp);

            // Let Ghost handle starting our server instance.
            return ghostServer.start(this.parentApp).then(() => {
                // if IPC messaging is enabled, ensure ghost sends message to parent
                // process on successful start
                if (process.send) {
                    process.send({ started: true });
                }
            });
        }).catch(err => {
            if (!errors.utils.isIgnitionError(err)) {
                err = new errors.GhostError({ err: err });
            }

            if (process.send) {
                process.send({ started: false, error: err.message });
            }

            logging.error(err);
            process.exit(-1);
        });
    }
}

module.exports = GhostBootstrap;