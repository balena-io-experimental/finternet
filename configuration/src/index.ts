import { metrics } from '@balena/node-metrics-gatherer';
import * as bodyParser from 'body-parser';
import { spawn } from 'child_process';
import * as express from 'express';
import * as http from 'http';
import * as path from 'path';

const app = express();
const LISTEN_PORT = 8080;

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
	res.send('OK!');
	// nmcli dev wifi hotspot ifname wlp4s0 ssid test password "test1234"
	const args = [
		'dev',
		'wifi',
		'hotspot',
		'ifname',
		'wlan0',
		'ssid',
		_req.body['SSID'],
		'password',
		_req.body['password'],
	];
	// TODO should advertise with avahi to make connections easier
	const nmcli = spawn('nmcli', args, { stdio: 'pipe' });
	nmcli.stdout.on('data', data => {
		console.log(`stdout: ${data}`);
	});
	nmcli.stderr.on('data', data => {
		console.error(`stderr: ${data}`);
	});
	nmcli.on('close', code => {
		console.log(`child process exited with code ${code}`);
	});
});

app.get('/', (_req, res) => {
	res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

http
	.createServer(app)
	.listen(LISTEN_PORT, () => console.log(`Listening on port ${LISTEN_PORT}`));
