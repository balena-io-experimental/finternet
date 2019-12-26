import * as Bluebird from 'bluebird';
import { Message, systemBus } from 'dbus-native';
import * as _ from 'lodash';

/** DBus controller */
export const dbus = systemBus();
/**
 * DBus invoker.
 *
 * @param message DBus message to send
 */
export const dbusInvoker = (message: Message): PromiseLike<any> => {
	return Bluebird.fromCallback(cb => {
		return dbus.invoke(message, cb);
	});
};
