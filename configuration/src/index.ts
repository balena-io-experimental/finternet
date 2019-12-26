import { metrics } from '@balena/node-metrics-gatherer';
import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as http from 'http';
import * as path from 'path';

import { configureStatic, createHotspot } from './nm';

import { publishLocal } from './avahi';

const app = express();

// defaults
const LISTEN_PORT = 80;
const DEFAULT_IFACE = process.env.DEFAULT_IFACE || 'uap0';
const DEFAULT_SSID = process.env.DEFAULT_SSID || 'test1234';
const DEFAULT_PASS = process.env.DEFAULT_PASS || '12345678';
const DEFAULT_HOSTNAME = process.env.DEFAULT_HOSTNAME || 'finternet.local';

app.disable('x-powered-by');
app.use((req, res, next) => {
	res.header('Access-Control-Allow-Origin', req.get('Origin') || '*');
	res.header('Access-Control-Allow-Methods', 'GET, POST');
	res.header(
		'Access-Control-Allow-Headers',
		'Content-Type, Authorization, Application-Record-Count, MaxDataServiceVersion, X-Requested-With',
	);
	res.header('Access-Control-Allow-Credentials', 'true');

	next();
});

app.options('*', (_req, res) => res.sendStatus(200));
app.get('/ping', (_req, res) => res.send('OK'));
app.use('/metrics', metrics.requestHandler());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

app.post('/configure-hotspot', (_req, res) => {
	console.log(_req.body);

	createHotspot({
		name: _req.body['SSID'],
		password: _req.body['password'],
		iface: DEFAULT_IFACE,
	});

	res.redirect('/');
});

app.post('/configure-ethernet', (_req, res) => {
	console.log(_req.body);

	configureStatic({
		address: _req.body['address'],
		netmask: _req.body['netmask'],
		gateway: _req.body['gateway'],
		dnsServers: _req.body['dnsServers'],
		dnsSearch: _req.body['dnsSearch'],
	});

	res.redirect('/');
});

app.get('/', (_req, res) => {
	res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

createHotspot({
	name: DEFAULT_SSID,
	password: DEFAULT_PASS,
	iface: DEFAULT_IFACE,
});

publishLocal({ hostname: DEFAULT_HOSTNAME, iface: DEFAULT_IFACE });

http
	.createServer(app)
	.listen(LISTEN_PORT, () => console.log(`Listening on port ${LISTEN_PORT}`));
