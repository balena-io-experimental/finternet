import { spawn } from 'child_process';

interface Hotspot {
	iface: string;
	name: string;
	password?: string;
}

interface Static {
	address: string;
	netmask: number;
	gateway: string;
	dnsServers?: string;
	dnsSearch?: string;
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
	nmInvoker(args);
};

export const configureStatic = (staticDetails: Static): void => {
	// nmcli con mod "Wired connection 1" \
	//   ipv4.addresses "10.200.2.200/24" \
	//   ipv4.gateway "10.200.2.1" \
	//   ipv4.dns "10.200.2.2,10.200.2.3" \
	//   ipv4.dns-search "myDomain.org" \
	//   ipv4.method "manual"
	const args = [
		'con',
		'mod',
		"'Wired Connection 1'",
		'ipv4.addresses',
		`${staticDetails.address}/${staticDetails.netmask}`,
		'ipv4.gateway',
		staticDetails.gateway,
		'ipv4.method',
		'manual',
	];
	if (staticDetails.dnsServers) {
		args.push('ipv4.dns', staticDetails.dnsServers);
	}
	if (staticDetails.dnsSearch) {
		args.push('ipv4.dns-search', staticDetails.dnsSearch);
	}
	nmInvoker(args);
};

const nmInvoker = (args: string[]): void => {
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
