import * as http from 'http';
import * as websocket from 'websocket';
import * as redis from 'redis';
import Xev from 'xev';

import MainStreamConnection from './stream';
import { ParsedUrlQuery } from 'querystring';
import authenticate from './authenticate';
import { EventEmitter } from 'events';
import config from '../../config';

module.exports = (server: http.Server) => {
	// Init websocket server
	const ws = new websocket.server({
		httpServer: server
	});

	ws.on('request', async (request) => {
		const connection = request.accept();

		const q = request.resourceURL.query as ParsedUrlQuery;
		const [user, app] = await authenticate(q.i as string);

		let ev: EventEmitter;

		if (config.redis) {
			// Connect to Redis
			const subscriber = redis.createClient(
				config.redis.port, config.redis.host);

			subscriber.subscribe('misskey');

			ev = new EventEmitter();

			subscriber.on('message', async (_, data) => {
				const obj = JSON.parse(data);

				ev.emit(obj.channel, obj.message);
			});

			connection.once('close', () => {
				subscriber.unsubscribe();
				subscriber.quit();
			});
		} else {
			ev = new Xev();
		}

		const main = new MainStreamConnection(connection, ev, user, app);

		// 後方互換性のため
		if (request.resourceURL.pathname !== '/streaming') {
			main.sendMessageToWsOverride = (type: string, payload: any) => {
				if (type == 'channel') {
					type = payload.type;
					payload = payload.body;
				}
				if (type.startsWith('api:')) {
					type = type.replace('api:', 'api-res:');
				}
				connection.send(JSON.stringify({
					type: type,
					body: payload
				}));
			};

			main.connectChannel(Math.random().toString().substr(2, 8), null,
				request.resourceURL.pathname === '/' ? 'homeTimeline' :
				request.resourceURL.pathname === '/local-timeline' ? 'localTimeline' :
				request.resourceURL.pathname === '/hybrid-timeline' ? 'hybridTimeline' :
				request.resourceURL.pathname === '/global-timeline' ? 'globalTimeline' : null);

			if (request.resourceURL.pathname === '/') {
				main.connectChannel(Math.random().toString().substr(2, 8), null, 'main');
			}
		}

		connection.once('close', () => {
			ev.removeAllListeners();
			main.dispose();
		});

		connection.on('message', async (data) => {
			if (data.utf8Data == 'ping') {
				connection.send('pong');
			}
		});
	});
};
