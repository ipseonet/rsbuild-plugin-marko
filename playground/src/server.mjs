import express from 'express';
import { createRsbuild, loadConfig } from '@rsbuild/core';
import markoExpress from '@marko/express'
// import routes from './config/routes.js';

const CLIENT_PORT = 8000; // Port for the client-side application
const SERVER_PORT = 4000; // Port for the server-side API

async function startDevServer() {
    const { content } = await loadConfig({});
    const rsbuild = await createRsbuild({
        rsbuildConfig: content,
    });

    const app = express();
    const rsbuildServer = await rsbuild.createDevServer({
        listen: {
            port: CLIENT_PORT,
        }
    });

    // app.use('/', routes)
    app.use(rsbuildServer.middlewares);
    app.use(markoExpress());

    app.listen(SERVER_PORT, () => {
        console.log(`API server is running on http://localhost:${SERVER_PORT}`);
    })

    const httpServer = app.listen(CLIENT_PORT, async () => {
        await rsbuildServer.afterListen();
        console.log(`Client is running on http://localhost:${CLIENT_PORT}`);
    });

    rsbuildServer.connectWebSocket({ server: httpServer });
}

startDevServer(process.cwd());