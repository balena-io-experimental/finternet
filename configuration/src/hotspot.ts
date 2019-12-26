import { spawn } from 'child_process';

interface Hotspot {
	iface: string;
	name: string;
	password?: string;
}

export const createHotspot = (hotspotDetails: Hotspot): void => {
	// nmcli dev wifi hotspot ifname wlp4s0 ssid test password "test1234"
	const args = [
		'dev',
		'wifi',
		'hotspot',
		'ifname',
		hotspotDetails.iface,
		'ssid',
		hotspotDetails.name,
	];
	if (hotspotDetails.password) {
		args.push('password', hotspotDetails.password);
	}
	console.log(args);
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
};
