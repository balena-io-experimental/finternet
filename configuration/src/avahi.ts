import * as Bluebird from 'bluebird';
import * as _ from 'lodash';
import * as os from 'os';
import * as request from 'request-promise';

import { dbusInvoker } from './dbus';

interface Hostname {
	iface: string;
	hostname: string;
}

/**
 * Supervisor returned device details interface.
 */
interface HostDeviceDetails {
	api_port: string;
	ip_address: string;
	os_version: string;
	supervisor_version: string;
	update_pending: boolean;
	update_failed: boolean;
	update_downloaded: boolean;
	commit: string;
	status: string;
	download_progress: string | null;
}

/**
 * Hosts published via Avahi.
 */
interface PublishedHosts {
	/** The Avahi group used to publish the host */
	group: string;
	/** The full hostname of the published host */
	hostname: string;
	/** The IP address of the published host */
	address: string;
}

/** List of published hosts */
const publishedHosts: PublishedHosts[] = [];

/**
 * Retrieves the IPv4 address for the named interface.
 *
 * @param intf Name of interface to query
 */
const getNamedInterfaceAddr = (intf: string): string => {
	const nics = os.networkInterfaces()[intf];

	if (!nics) {
		throw new Error('The configured interface is not present, exiting');
	}

	// We need to look for the IPv4 address
	let ipv4Intf;
	for (const nic of nics) {
		if (nic.family === 'IPv4') {
			ipv4Intf = nic;
			break;
		}
	}

	if (!ipv4Intf) {
		throw new Error(
			'IPv4 version of configured interface is not present, exiting',
		);
	}

	return ipv4Intf.address;
};

/**
 * Retrieve the IPv4 address for the default balena internet-connected interface.
 */
const getDefaultInterfaceAddr = async (): Promise<string> => {
	let deviceDetails: HostDeviceDetails | null = null;

	// We continue to attempt to get the default IP address every 10 seconds,
	// inifinitely, as without our service the rest won't work.
	while (!deviceDetails) {
		try {
			deviceDetails = await request({
				uri: `${process.env.BALENA_SUPERVISOR_ADDRESS}/v1/device?apikey=${process.env.BALENA_SUPERVISOR_API_KEY}`,
				json: true,
				method: 'GET',
			}).promise();
		} catch (_err) {
			console.log(
				'Could not acquire IP address from Supervisor, retrying in 10 seconds',
			);
			await Bluebird.delay(10000);
		}
	}

	// Ensure that we only use the first returned IP address route. We don't want to broadcast
	// on multiple subnets.
	return deviceDetails.ip_address.split(' ')[0];
};

/**
 * Retrieve a new Avahi group for address publishing.
 */
const getGroup = async (): Promise<string> => {
	return await dbusInvoker({
		destination: 'org.freedesktop.Avahi',
		path: '/',
		interface: 'org.freedesktop.Avahi.Server',
		member: 'EntryGroupNew',
	});
};

/**
 * Add a host address to the local domain.
 *
 * @param hostname Full hostname to publish
 * @param address  IP address for the hostname
 */
const addHostAddress = async (
	hostname: string,
	address: string,
): Promise<void> => {
	// If the hostname is already published with the same address, return
	if (_.find(publishedHosts, { hostname, address })) {
		return;
	}

	console.log(`Adding ${hostname} at address ${address} to local mDNS pool`);

	// We require a new group for each address.
	// We don't catch errors, as our restart policy is to not restart.
	const group = await getGroup();

	await dbusInvoker({
		destination: 'org.freedesktop.Avahi',
		path: group,
		interface: 'org.freedesktop.Avahi.EntryGroup',
		member: 'AddAddress',
		body: [-1, -1, 0x10, hostname, address],
		signature: 'iiuss',
	});

	await dbusInvoker({
		destination: 'org.freedesktop.Avahi',
		path: group,
		interface: 'org.freedesktop.Avahi.EntryGroup',
		member: 'Commit',
	});

	// Add to the published hosts list
	publishedHosts.push({
		group,
		hostname,
		address,
	});
};

export const publishLocal = async (host: Hostname) => {
	try {
		let ipAddr: string;
		// Get IP address for the specified interface, and the TLD to use.
		if (host.iface) {
			ipAddr = getNamedInterfaceAddr(host.iface);
		} else {
			ipAddr = await getDefaultInterfaceAddr();
		}

		return addHostAddress(host.hostname, ipAddr);
	} catch (err) {
		console.log(`mDNS publisher error:\n${err}`);
		// This is not ideal. However, dbus-native does not correctly free connections
		// on event loop exit
		process.exit(1);
	}
};
