# finternet
An indestructible box of internet.

## Materials
1. balenaFin 1.1

_OPTIONAL (for mobile power):_
1. USB cable
1. Jumper cables
1. USB power bank

_OPTIONAL (for GSM inputs):_
1. Quectel EG25-G
1. Antenna (https://www.amazon.co.uk/Alda-PQ-Antenna-printed-circuit/dp/B06XWTPY7C/ref=sr_1_2?keywords=lte+ufl+antenna&qid=1575455827&refinements=p_76%3A419158031&rnid=419157031&rps=1&sr=8-2)

## Mobile power setup
![battery-powered-fin](./battery-powered-fin.jpg?raw=true)

## Configuration
The following inputs can be used:

1. Ethernet
1. Wifi (requires configuration)
1. GSM (requires configuration)

The following outputs can be used to share internet:

1. Wifi (configurable SSID/password)
1. (TODO) Ethernet (requires second ethernet port to use ethernet input)
1. (TODO) Bluetooth
1. (TODO) USB

## TODO:
1. Ethernet output
1. Bluetooth output
1. USB output
1. NTP over LAN

## NOTES:
hotspot always on

connect to network and captive portal (only if no wifi connection at all?)

finternet.local (kind of like BoB)

simple express server for config (with link states)

1. output config

	wifi:

		SSID

		PSK

1. input config

	wifi (handled by wifi-connect?):

		SSID

		PSK

	gsm:

		APN

	ethernet:

		static IP

add data, press reconfigure, handles connection

multiple inputs handled with routing metrics for fallback
