import { spawn } from 'child_process';

import { dbusInvoker } from './dbus';

interface WirelessNetwork {
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

// for i in $(dbus-send --print-reply --system --dest=org.freedesktop.NetworkManager /org/freedesktop/NetworkManager org.freedesktop.NetworkManager.GetDevices | awk '/Devices/{print $NF}' | sed -e 's/"//g'); do dbus-send --system --print-reply --dest=org.freedesktop.NetworkManager $i org.freedesktop.DBus.Properties.Get string:"org.freedesktop.NetworkManager.Device" string:"DeviceType"; done

// NM_DEVICE_TYPE_ETHERNET = 1 a wired ethernet device
// NM_DEVICE_TYPE_WIFI = 2 an 802.11 Wi-Fi device

export const getDevices = async (): Promise<string> => {
	return await dbusInvoker({
		destination: 'org.freedesktop.NetworkManager',
		path: '/org/freedesktop/NetworkManager',
		interface: 'org.freedesktop.NetworkManager',
		member: 'GetDevices',
	});
};

export const connectToWifi = (
	wirelessNetworkDetails: WirelessNetwork,
): void => {
	// nmcli device wifi connect SSID-Name password wireless-password
	const args = [
		'device',
		'wifi',
		'connect',
		'ifname',
		wirelessNetworkDetails.iface,
		'ssid',
		wirelessNetworkDetails.name,
	];
	if (wirelessNetworkDetails.password) {
		args.push('password', wirelessNetworkDetails.password);
	}
	nmInvoker(args);
};

export const manageDevice = (device: string): void => {
	// nmcli device set uap0 managed yes
	const args = ['device', 'set', device, 'managed', 'yes'];
	nmInvoker(args);
};

export const createHotspot = (hotspotDetails: WirelessNetwork): void => {
	// nmcli device wifi hotspot ifname wlp4s0 ssid test password "test1234"
	const args = [
		'device',
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
		'connection',
		'modify',
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
